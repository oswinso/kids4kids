var express = require('express');
var router = express.Router();
var passport = require('passport');

var mongoose = require('mongoose');
var User = require('../models/User.js');
var Program = require('../models/Program.js');
var Session = require('../models/Session.js');
var Volunteer = require('../models/Volunteer.js');
var Record = require('../models/Record.js');
var async = require('async');

// Middleware function to ensure authenticated
var ensureAuthenticated = function(req, res, next) {
	if(!req.isAuthenticated()) {
		res.status(401).json({
			status: 'error',
			data: null,
			message: 'Unathorized'
		});
		res.end();
	} else {
		next();
	}
};

var ensureAdmin = function(req, res, next) {
	if(!req.user.admin) {
		res.status(401).json({
			status: 'error',
			data: null,
			message: 'Unathorized'
		});
		res.end();
	} else {
		next();
	}
};

// Function that returns true if the user has permissions to modify the specified program
var ensurePermissionsWithProgramID = function(user, programID, callback) {
	Program.findById(programID, function(err, program) {
		if(err) {
			callback("Error");
		} else {
			// Admins can access anything :)
			if(user.admin) {
				callback();
				return;
			}
			// Check if user is in program's leaders list
			for(var i = 0; i < program.leaders.length; i++) {
				if(program.leaders[i]._id.equals(user._id)) {
					// Found user id in program leaders, No error
					callback();
					return;
				}
			}
			// Didn't find, user unauthorized.
			callback("Error");
		}
	});
}

var ensurePermissionsWithSessionID = function(user, sessionID, callback) {
	Session.findById(sessionID, function(err, session) {
		if(err) {
			callback("Error");
		} else {
			ensurePermissionsWithProgramID(user, session.programID, function(err) {
				if(err) {
					callback(err);
				} else {
					callback();
				}
			});
		}
	});
}

// List programs
router.get('/programs', ensureAuthenticated, function(req, res) {
	Program.find(req.query, function(err, programs) {
		if(err) {
			res.send(err);
		}
		// Go through each result, only return ones that user has permissions to
		var controlledPrograms = [];
		async.each(programs, function(program, callback) {
			ensurePermissionsWithProgramID(req.user, program._id, function(err) {
				if(err) {
					callback();
				} else {
					controlledPrograms.push(program);
					callback();
				}
			});
		}, function(err) {
			if(err) {
				console.log(err);
				res.status(500).json({
					status: 'error',
					data: null,
					message: 'Error'
				});
			} else {
				res.status(200).json(controlledPrograms);
			}
		});
	});
});

// Get program by id
router.get('/programs/:id', ensureAuthenticated, function(req, res) {
	Program.findById(req.params.id, function(err, program) {
		if(err) {
			return res.status(500).json({
				status: 'error',
				data: null,
				message: 'Error'
			});
		}
		console.log(program);
		res.status(200).json(program);
	});
});

// Get program by array of IDs
router.post('/programs', ensureAdmin, function(req, res) {
	if(req.body.ids) {
		var objectIDs = [];
		for(var i = 0; i < req.body.ids.length; i++) {
			objectIDs.push(mongoose.Types.ObjectId(req.body.ids[i]));
		}
		Program.find( { _id : { $in : objectIDs } }, function(err, programs) {
			if(err) {
				return res.status(500).json(err);
			}
			console.log(programs);
			return res.status(200).json(programs);
		});
	} else {
		return res.status(200).json();
	}
})

// Create a program
router.post('/program', ensureAuthenticated, function(req, res) {
	// Create a Program
	if(!req.body.location || !req.body.project) {
		return res.status(400).json({
			err: 'Missing fields'
		});
	} else {
		Program.create(req.body, function(err, program) {
			if(err) {
				return res.status(400).send(err);
			}

			// Return id of program after created
			return res.status(201).json({
				status: 'success',
				data: {
					id: program.id
				}
			});
		});
	}
});

router.delete('/programs/:programID', ensureAdmin, function(req, res) {
	Program.findById(req.params.programID, function(err, program) {
		if(err) {
			return res.status(400).json({err: err});
		}
		if(!program) {
			return res.status(400).json({err: "Program not found"});
		}
		program.remove(function(err) {
			if(err) {
				return res.status(400).json({err: err});
			} else {
				return res.status(200).json({status: "Success"});
			}
		});
	});
});

// Adds program to user
router.post('/addProgramToUser', ensureAdmin, function(req, res) {
	if(!req.body.userID || !req.body.programID) {
		return res.status(400).json({
			err: "Invalid Request"
		});
	} else {
		Program.findById(req.body.programID, function(err, program) {
			if(err) {
				return res.status(500).json(err);
			}
			if(!program) {
				return res.status(500).json(err);
			} else {
				// Found program, finding user
				User.findById(req.body.userID, function(err, user) {
					if(err) {
						return res.status(500).json(err);
					}
					if(!program) {
						return res.status(500).json(err);
					} else {
						// Found both, checking existing then modifying
						var found = false;
						if(user.programs) {
							for (var i = 0; i < user.programs.length; i++) {
								if(user.programs[i].toString() == program._id.toString()) {
									found = true;
								}
							}
						}
						if(!found) {
							user.programs.push(program._id);
						}

						found = false;
						if(program.leaders) {
							for(var i = 0; i < program.leaders.length; i++) {
								if(program.leaders[i]._id.toString() == user._id.toString()) {
									found = true;
								}
							}
						}
						if(!found) {
							program.leaders.push(user._id);
						}

						// Saving both
						user.save(function(err) {
							if(err) {
								return res.status(500).json(err);
							}
							program.save(function(err) {
								if(err) {
									return res.status(500).json(err);
								}
								// No errors.
								return res.status(200).json({
									status: "Success"
								});
							});
						});
					}
				});
			}
		});
	}
});

// Remove program from user
router.post('/removeProgramFromUser', ensureAdmin, function(req, res) {
	console.log("1");
	console.log(req.body.userID);
	console.log("2");
	console.log(req.body.programID);
	if(!req.body.userID || !req.body.programID) {
		return res.status(400).json({
			err: "Invalid Request"
		});
	} else {
		console.log("3");
		Program.findById(req.body.programID, function(err, program) {
			if(err) {
				return res.status(500).json(err);
			}
			if(!program) {
				return res.status(500).json(err);
			} else {
				// Found program, finding user
				User.findById(req.body.userID, function(err, user) {
					if(err) {
						return res.status(500).json(err);
					}
					if(!program) {
						return res.status(500).json(err);
					} else {
						// Found both, removing from each other
						console.log("User");
						console.log(user.programs);
						console.log("Program");
						console.log(program.leaders);
						for (var i = 0; i < user.programs.length; i++) {
							if(user.programs[i].toString() == program._id.toString()) {
								user.programs.splice(i, 1);
								break;
							}
						}

						for(var i = 0; i < program.leaders.length; i++) {
							if(program.leaders[i]._id.toString() == user._id.toString()) {
								program.leaders.splice(i, 1);
								break;
							}
						}

						// Saving both
						user.save(function(err) {
							if(err) {
								return res.status(500).json(err);
							}
							program.save(function(err) {
								if(err) {
									return res.status(500).json(err);
								}
								// No errors.
								return res.status(200).json({
									status: "Success"
								});
							});
						});
					}
				});
			}
		});
	}
});

router.put('/programs/:programID', ensureAdmin, function(req, res) {
	if(!req.body.program) {
		return res.status(400).json("Invalid");
	} else {
		Program.findById(req.body.program._id, function(err, program) {
			if(err) {
				return res.status(400).json(err);
			}
			if(!program) {
				return res.status(400).json("Not Found");
			}
			program.location = req.body.program.location;
			program.project = req.body.program.project;
			program.save(function(err) {
				if(err) {
					return res.status(400).json(err);
				} else {
					console.log("Success putting: ")
					console.log(req.body.program._id);
					return res.status(200).json({
						status: "Success"
					});
				}
			});
		});
	}
});


router.get('/sessions', ensureAuthenticated, function(req, res) {
	if(req.query.time.indexOf("$gte") > -1) {
		req.query.time = JSON.parse(req.query.time);
	}
	Session.find(req.query).sort({time: 'asc'}).exec(function(err, sessions) {
		if(err) {
		res.status(500).json({
			status: 'error',
			data: null,
			message: 'Error'
		});

		} else {
			res.status(200).json(sessions);
		}
	});
});

// Create a Session
router.post('/sessions', ensureAuthenticated, function(req, res, next) {
	console.log(req.body);
	// Create a Program
	if(!req.body.programID || !req.body.time) {
		res.status(400).json({
			status: 'error',
			data: null,
			message: 'Missing fields'
		});
	} else {
		Session.create(req.body, function(err, session) {
			if(err) {
				res.status(400).send(err);
			}

			// Return id of program after created
			res.status(201).json({
				status: 'success',
				data: {
					id: session.id
				},
				message: null
			});
			next();
		});
	}
});

// Modify the specified recordw

router.put('/record/:recordID', ensureAuthenticated, function(req, res) {
	if(req.body.record) {
		Record.findById(req.params.recordID, function(err, record) {
			if(err) {
				console.log(err);
				res.status(500).json({
					status: 'error',
					data: null,
					message: 'Error'
				});
				return;
			} else {
				record.present = req.body.record.present;

				record.save(function(err) {
					if(err) {
						console.log(err);
						res.status(400).send(err);
						return;
					} else {
						console.log("put success");
						console.log(record);
						res.status(200).json({
							status: 'success',
							data: record.id,
							message: null
						});
						return;
					}
				});
			}
		});
	}
});

router.delete('/record/:recordID', ensureAuthenticated, function(req, res) {
	// Find record. If it exists, delete it, as well as remove from the "records" field of the session.
	Record.findById(req.params.recordID, function(err, record) {
		if(err) {
			console.log(err);
			res.status(500).json({
				status: 'error',
				data: null,
				message: err
			});
			return;
		}
		// If found, delete from sessions and record itself.
		Session.findById(record.sessionID, function(err, session) {
			if(err) {
				console.log(err);
				res.status(500).json({
					status: 'error',
					data: null,
					message: err
				});
				return;
			}
			// Remove record from "records" field of sessions
			for(var i = 0; i < session.records.length; i++ ){
				if(session.records[i]._id.toString() === record._id.toString()) {
					session.records.splice( i, 1 );
					break;
				}
			}
			// Save Modified Session
			session.save(function(err) {
				if(err) {
					res.status(500).json({
						status: 'error',
						data: null,
						message: err
					});
					return;
				} else {
					// Remove Record
					record.remove(function(err) {
						if(err) {
							res.status(500).json({
								status: 'error',
								data: null,
								message: err
							});
						} else {
							console.log("Successfully Deleted!");
							res.status(200).json({
								status: 'success',
								data: record._id,
								message: null
							});
						}
					});
				}
			});
		});
	});
});

// Create record with sessionID and volunteerID, Add record to session, return record
router.post('/sessions/:sessionID/volunteer/:volunteerID', ensureAuthenticated, function(req, res) {
	ensurePermissionsWithSessionID(req.user, req.params.sessionID, function(err) {
		// Send unathorized if user doen't have authorization
		if(err) {
			res.status(401).json({
				status: 'error',
				data: null,
				message: 'Unathorized'
			});
			return;
		} else {
			console.log("yay it passed");
			Record.findOne({
				sessionID: req.params.sessionID,
				volunteerID: req.params.volunteerID
			}, function(err, existing) {
				if(existing) {
					console.log("Found existing record");
					res.status(409).json({
						status: 'error',
						data: null,
						message: 'Volunteer is already participating in session'
					});
					return;
				} else {
					console.log("Finding session by ID");
					Session.findById(req.params.sessionID, function(err, session) {
						if(err) {
							console.log(err);
							res.status(500).json({
								status: 'error',
								data: null,
								message: 'Error'
							});
							return;
						} else {
							console.log("Creating Record");
							Record.create({
								sessionID: req.params.sessionID,
								volunteerID: req.params.volunteerID
							}, function(err, record) {
								console.log("Created!");
								if(err) {
									console.log("Error!!!");
									console.log(err);
									res.status(400).send(err);
									return;
								} else {
									// Add created record to session
									session.records.push(record);
									session.save(function(err) {
										if(err) {
											console.log(err);
											res.status(400).send(err);
											return;
										} else {
											// Return the record after created
											res.status(201).json({
												status: 'success',
												data: {
													id: record.id
												},
												message: null
											});
											return;
										}
									});
								}
							});
						}
					});
				}
			})
			return;
		}
	});
});

// Get Volunteers based on name
router.get('/volunteers/name/:contains', ensureAuthenticated, function(req, res, next) {
	// If "name contains" is passed:
	if(!req.params.contains) {
		res.status(200);
	} else {
		Volunteer.find({
			name: {
				"$regex": req.params.contains,
				"$options": "i"
			}
		}).exec(function(err, volunteers) {
			if(err) {
				res.status(500).json({
					status: 'error',
					data: null,
					message: 'Error'
				});
			} else {
				res.status(200).json(volunteers);
			}
		})
	}
});

// Create a Volunteer
router.post('/volunteers', ensureAuthenticated, function(req, res, next) {
	// Create a Progam
	// If there is no name or one of phone / email isn't present:
	console.log(req.body);
	if(!req.body.name || !(req.body.phone || req.body.email)) {
		res.status(400).json({
			status: 'error',
			data: null,
			message: 'Missing fields'
		});
	} else {
		Volunteer.create(req.body, function(err, volunteer) {
			if(err) {
				res.status(400).send(err);
			} else {
				// Return id of program after created
				res.status(201).json({
					status: 'success',
					data: volunteer,
					message: null
				});
				next();
			}
		})
	}
});

router.get('/records/sessionID/:sessionID', ensureAuthenticated, function(req, res) {
	Record.find({
		sessionID: req.params.sessionID
	}, function(err, records) {
		if(err) {
			console.log(err);
			res.status(500).json({
				status: 'error',
				data: null,
				message: 'Error'
			});
		} else {
			res.status(200).json(records);
			return;
		}
	});
});

router.put('/session/:sessionID', ensureAuthenticated, function(req, res) {
	if(req.body) {
		Session.findById(req.params.sessionID, function(err, session) {
			session.time = req.body.time;
			session.save(function(err) {
				if(err) {
					console.log(err);
					res.status(400).send(err);
					return;
				} else {
					// Return the record after created
					res.status(200).json({
						status: 'success',
						data: {
							id: session.id
						},
						message: null
					});
					return;
				}
			})
		})
	}
})

module.exports = router;