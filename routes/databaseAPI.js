var express = require('express');
var router = express.Router();
var passport = require('passport');

var mongoose = require('mongoose');
var Program = require('../models/Program.js');
var Session = require('../models/Session.js');
var Volunteer = require('../models/Volunteer.js');
var Record = require('../models/Record.js');

// List programs
router.get('/programs', function(req, res) {
	console.log("req.query: ");
	console.log(req.query);
	Program.find(req.query, function(err, programs) {
		if(err) {
			res.send(err);
		}
		// console.log(programs);
		res.status(200).json(programs);
	});
});

router.get('/programs/:id', function(req, res) {
	Program.findById(req.params.id, function(err, program) {
		if(err) {
			res.status(500).json({
				status: 'error',
				data: null,
				message: 'Error'
			});
		}
		console.log(program);
		res.status(200).json(program);
	});
});

// Create a program
router.post('/programs', function(req, res, next) {
	// Create a Program
	if(!req.body.location || !req.body.project) {
		res.status(400).json({
			status: 'error',
			data: null,
			message: 'Missing fields'
		});
	} else {
		Program.create(req.body, function(err, program) {
			if(err) {
				res.status(400).send(err);
			}

			// Return id of program after created
			res.status(201).json({
				status: 'success',
				data: {
					id: program.id
				},
				message: null
			});
			next();
		});
	}
});

router.get('/sessions', function(req, res) {
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
router.post('/sessions', function(req, res, next) {
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

router.put('/record/:recordID', function(req, res) {
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

router.delete('/record/:recordID', function(req, res) {
	console.log("Ran!");
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
router.post('/sessions/:sessionID/volunteer/:volunteerID', function(req, res) {
	Record.findOne({
		sessionID: req.params.sessionID,
		volunteerID: req.params.volunteerID
	}, function(err, existing) {
		if(existing) {
			res.status(409).json({
				status: 'error',
				data: null,
				message: 'Volunteer is already participating in session'
			});
			return;
		} else {
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
});

// Get Volunteers based on name
router.get('/volunteers/name/:contains', function(req, res, next) {
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
router.post('/volunteers', function(req, res, next) {
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

router.get('/records/sessionID/:sessionID', function(req, res) {
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

module.exports = router;