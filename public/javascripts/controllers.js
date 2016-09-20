angular.module('myApp').controller('loginController',
	['$scope', '$location', 'spreadsheetService','AuthService',
	function($scope, $location, $spreadsheetService, AuthService) {
		$scope.login = function() {
			// Initial Values
			$scope.error = false;
			$scope.disabled = true;

			// Call login from service
			AuthService.login($scope.loginForm.username, $scope.loginForm.password)
				// handle success
				.then(function() {
					if(AuthService.isAdmin()) {
						$location.path('/admin');
					} else {
						$location.path('/dashboard');
					}
					$scope.disabled = false;
					$scope.loginForm = {};
				})
				// handle error
				.catch(function() {
					$scope.error = true;
					$scope.errorMessage = "Invalid username or password";
					$scope.disabled = false;
					$scope.loginForm = {};
				});
		};

		$scope.submitVisitor = function() {
			spreadsheetService.logVisitor($scope.visitor)
			.then(function(response) {
				console.log(response);
			})
			.catch(function(err) {
				console.log(err);
			});
		};
}]);

angular.module('myApp').controller('logoutController',
	['$scope', '$location', 'AuthService',
	function($scope, $location, AuthService) {
		$scope.logout = function() {
			// Call logout from service
			AuthService.logout()
			.then(function() {
				$location.path('/login');
			})
			.catch(function(err) {
				$location.path('/login');
			});
		};
}]);

angular.module('myApp').controller('registerController',
	['$scope', '$location', '$routeParams', 'registrationService', 'AuthService',
	function($scope, $location, $routeParams, registrationService, AuthService) {
		$scope.registerForm = {
			name: "",
			username: "",
			password: "",
			email: "",
			phone: ""
		};

		// Get values from DB
		registrationService.getUser($routeParams.token)
		.then(function(user) {
			$scope.valid = true;
			$scope.registerForm.name = user.name;
			$scope.registerForm.email = user.email;
			$scope.registerForm.phone = user.phone;
		})
		.catch(function(err) {
			$scope.error = true;
			$scope.valid = false;
			$scope.errorMessage = "The registration URL is invalid. Please try again.";
		});

		$scope.register = function() {
			// Initial Values
			$scope.error = false;
			$scope.disabled = true;

			if($scope.valid) {
				AuthService.register()
			}
			AuthService.register($scope.registerForm.username, $scope.registerForm.name, $scope.registerForm.password, $scope.registerForm.email, $scope.registerForm.phone)
			// handle success
			.then(function() {
				registrationService.removeUser($routeParams.token)
				.then(function() {
					$location.path('/login');
					$scope.disabled = false;
					$scope.registerForm = {};
				})
				.catch(function() {
					$location.path('/login');
					$scope.disabled = false;
					$scope.registerForm = {};
				});
			})
			// handle error
			.catch(function() {
				$scope.error = true;
				$scope.errorMessage = "Something went wrong while registering your account";
				$scope.disabled = false;
				$scope.registerForm = {};
			});
		};
}]);

angular.module('myApp').controller('dashboardController', function($scope, $location, databaseService, AuthService, $uibModal) {

	// Initial Values
	$scope.error = false;
	$scope.admin = AuthService.isAdmin();
	$scope.editing = false;

	// Get programs from database
	var getPrograms = function() {
		databaseService.getPrograms()
		// Handle success
		.then(function(programs) {
			$scope.programs = programs;
		})
		// Handle Error
		.catch(function(error) {
			$scope.error = true;
			$scope.errorMessage = error;
		});
	}

	getPrograms();

	// Filter to ensure that volunteers shown are not already participating.
	$scope.filterAlreadyParticipating = function(volunteer) {
		for(var i = 0; i < $scope.currentSession.records.length; i++) {
			if($scope.currentSession.records[i].volunteerID._id == volunteer._id) {
				return false;
			}
		}
		return true;
	}

	$scope.editPrograms = function() {
		$scope.editing = true;
		$scope.copy = $scope.programs;
	}

	$scope.saveChanges = function() {
		$scope.editing = false;
	}

	$scope.modifyProgram = function(program) {
		databaseService.modifyProgram(program)
		.then(function() {
			console.log(""); // It werks
		})
		.catch(function(err) {
			if(err) {
				$scope.err = true;
				$scope.errorMessage = err;
			}
		});
	}

	// Creates Register Volunteer Modal
	$scope.openDeleteModal = function(program) {
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'deleteTemplate.html',
			controller: 'deleteModalCtrl',
			resolve: {
				program: function() {
					return program;
				}
			}
		});

		modalInstance.result.then(function() {
			// Delete program
			databaseService.deleteProgram(program)
			.then(function() {
				// Remove program from list
				for(var i = 0; i < $scope.programs.length; i++) {
					if($scope.programs[i]._id == program._id) {
						// Found match
						$scope.programs.splice(i, 1);
						break;
					}
				}
				$scope.editPrograms();
			})
			.catch(function(err) {
				$scope.error = true;
				$scope.errorMessage = err;
			});
		});
	}

	$scope.openCreateProgramModal = function() {
		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'createTemplate.html',
			controller: 'createModalCtrl',
		});

		modalInstance.result.then(function(program) {
			databaseService.createProgram(program)
			.then(function() {
				getPrograms();
			})
			.catch(function(err){
				$scope.error = true;
				$scope.errorMessage = err;
			});
		});
	}
});

angular.module('myApp').controller('createModalCtrl', function($scope, $uibModalInstance) {

	$scope.program = {
		project : "",
		location : ""
	};

	$scope.error = false;
	$scope.errorMessage = "";

	// Delete Clicked
	$scope.submit = function() {
		if(!$scope.program.project || !$scope.program.location) {
			$scope.error = true;
			$scope.errorMessage = "Please fill in all fields";
		} else {
			$uibModalInstance.close($scope.program);
		}
	}
	
	// Close clicked
	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
});

angular.module('myApp').controller('deleteModalCtrl', function($scope, $uibModalInstance, program) {

	$scope.program = program;

	// Delete Clicked
	$scope.delete = function() {
		$uibModalInstance.close();
	}
	
	// Close clicked
	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
});

angular.module('myApp').controller('usersController',
	['$scope', '$location', 'registrationService', 'AuthService', '$uibModal',
	function($scope, $location, registrationService, AuthService, $uibModal) {

		// Initialize user list
		$scope.userList = [];

		$scope.confirmationButtonText = "Resend Confirmation Email"

		// Creates Register Volunteer Modal
		$scope.openInviteModal = function() {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'inviteUserTemplate.html',
				controller: 'inviteUserCtrl',
			});

			modalInstance.result.then(function(newUser) {
				inviteUser(newUser);
			});
		};

		$scope.canSend = function(date) {
			return Date.now() > (new Date(date).getTime() + (12*60*60*1000));
		}

		$scope.resendConfirmation = function(email) {
			registrationService.resendConfirmation(email)
			.then(function() {
				for(var i = 0; i < $scope.userList.length; i++ ){
					if($scope.userList[i].email === email) {
						$scope.userList[i].timestamp = Date.now();
						break;
					}
				}
			})
			.catch(function(err) {
				$scope.error = true;
				$scope.errorMessage = err;
			});
		};

		// Creates Register Volunteer Modal
		$scope.openUserProgramModal = function(user) {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'userProgramTemplate.html',
				controller: 'userProgramModalCtrl',
				resolve: {
					user: function() {
						return user;
					}
				}
			});

			modalInstance.result.then(function() {
				console.log(""); // Yay
			});
		}

		var refreshUsers = function() {
			$scope.userList = [];

			// Add all accepted users onto userList, excluding admins
			AuthService.listAll()
			.then(function(users) {
				if(users) {
					for(var i = 0; i < users.length; i++) {
						if(!users[i].admin) {
							$scope.userList.push({
								_id: users[i]._id,
								name: users[i].name,
								email: users[i].email,
								phone: users[i].phone,
								programs: users[i].programs,
								pending: false
							});
						}
					}
				}

				// Add all pending users onto userList
				registrationService.listAll()
				.then(function(tempUsers) {
					if(tempUsers) {
						for(var j = 0; j < tempUsers.length; j++) {
							$scope.userList.push({
								_id: tempUsers[j]._id,
								name: tempUsers[j].name,
								email: tempUsers[j].email,
								phone: tempUsers[j].phone,
								timestamp: tempUsers[j].timestamp,
								pending: true
							});
						}
					}
				})
				.catch(function(err) {
					$scope.error = true;
					$scope.errorMessage = err;
				});
			})
			.catch(function(err) {
				$scope.error = true;
				$scope.errorMessage = err;
			});
		};

		refreshUsers();

		var inviteUser = function(newUser) {
			registrationService.inviteUser(newUser)
			.then(function() {
				refreshUsers();
			})
			.catch(function(error) {
				$scope.error = true;
				$scope.errorMessage = "An error occured, please try again.";
			});
		}
}]);

angular.module('myApp').controller('userProgramModalCtrl', function($scope, $uibModalInstance, databaseService, user) {

	$scope.programs = [];
	$scope.managedPrograms = [];

	databaseService.getPrograms()
	.then(function(programs) {
		$scope.programs = programs;
	})
	.catch(function(err) {
		$scope.error = true;
		$scope.errorMessage = err;
	});

	databaseService.getProgramByIDs(user.programs)
	.then(function(managedPrograms) {
		$scope.managedPrograms = managedPrograms;
	})
	.catch(function(err) {
		$scope.error = true;
		$scope.errorMessage = err;
	});

	$scope.addProgram = function(program) {
		databaseService.addProgramToUser(user._id, program._id)
		.then(function() {
			// Add program to user
			$scope.managedPrograms.push(program);
		})
		.catch(function(err) {
			$scope.err = true;
			$scope.errorMessage = err;
		});
	}

	$scope.removeProgram = function(program) {
		databaseService.removeProgramFromUser(user._id, program._id)
		.then(function() {
			// Remove program from user
			for(var i = 0; i < $scope.managedPrograms.length; i++) {
				if($scope.managedPrograms[i]._id == program._id) {
					$scope.managedPrograms.splice(i, 1);
				}
			}
		})
		.catch(function(err) {
			$scope.err = true;
			$scope.errorMessage = err;
		});
	}

	// Filter to ensure that programs that are managed don't show in the list
	$scope.filterAlreadyManaging = function(program) {
		for(var i = 0; i < $scope.managedPrograms.length; i++) {
			if($scope.managedPrograms[i]._id == program._id) {
				return false;
			}
		}
		return true;
	}
	
	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
});

angular.module('myApp').controller('inviteUserCtrl',
	['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
	
	// Init Form Volunteers
	$scope.newUser = {
		name: "",
		email: "",
		phone: ""
	};

	$scope.inviteUserError = false;

	$scope.submit = function() {
		if($scope.newUser.name == "" || $scope.newUser.email == "") {
			$scope.inviteUserError = true;
			$scope.inviteUserErrorMessage = "Please fill in all required fields";
		} else {
			$uibModalInstance.close($scope.newUser);
		}
	}

	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
}]);

angular.module('myApp').controller('programController',
	['$scope', '$routeParams','focus', 'databaseService', 'AuthService', '$uibModal',
	function($scope, $routeParams, focus, databaseService, AuthService, $uibModal) {
		// Initialise Variables
		$scope.currentSession = null;
		$scope.time = {readable:"", old:""};
		$scope.searching = false;
		$scope.noResults = true;
		$scope.focus = false;
		$scope.search = {value: ""};
		$scope.errorMessage = "";
		$scope.editing = false;

		var today = new Date();
		var yesterday = today;
		var tomorrow = today;
		yesterday.setDate(today.getDate() - 1);
		tomorrow.setDate(today.getDate() + 1);

		databaseService.getProgramByID($routeParams.programID)
		.then(function(program) {
			$scope.program = program;
		})
		.catch(function(error) {
			$scope.error = true;
			$scope.errorMessage = "Cannot find specified program.";
		});

		var getCurrentSession = function(callback) {
			databaseService.getSessions({
				programID: $routeParams.programID,
				time: {
					$gte : yesterday.toISOString()
				}
			})
			// Handle success
			.then(function(sessions) {
				if(sessions) {
					$scope.sessions = sessions;

					// If session specified, and is valid, then that one is the current session.
					// If no session specified, get the closest one.
					if($routeParams.sessionID) {
						for(var i = 0; i < sessions.length; i++) {
							if(sessions[i]._id == $routeParams.sessionID) {
								$scope.currentSession = sessions[i];
								break;
							}
						}
						if(!$scope.currentSession) {
							$location.path('/programs/'+$routeParams.programID);
						}
					} else {
						$scope.currentSession = sessions[0];
					}
					if($scope.currentSession) {
						$scope.time.readable = new Date($scope.currentSession.time).toLocaleString();
					}
					if(callback) {
						callback();
					}
				}
			})
			.catch(function(error) {
				console.log(error);
				$scope.error = true;
				$scope.errorMessage = "Cannot find specified program.";
			});
		}

		getCurrentSession();

		// Creates a new session given a session object
		$scope.createSession = function(session) {
			if(session) {
				databaseService.createSession(session)
				.then(function(response) {
					getCurrentSession();
				})
				.catch(function(error) {
					$scope.error = true;
					$scope.errorMessage = error.message;
				});
			}
		};

		// Returns date
		$scope.getDateString = function(date) {
			return new Date(date).toLocaleString();
		};

		// When search box is changed
		$scope.onSearchChange = function() {
			if(!$scope.search.value) {
				$scope.results = null;
			} else {
				databaseService.getVolunteersByName($scope.search.value)
				.then(function(volunteers) {
					if(volunteers) {
						$scope.results = volunteers;
					} else {
						$scope.results = null;
					}
				})
				.catch(function(error) {
					$scope.error = true;
					$scope.errorMessage = error.message;
				});
			}
		};

		// When the volunteer is added by clicking on it
		$scope.selectResult = function(volunteer) {
			if(volunteer) {
				databaseService.addVolunteerToSession($scope.currentSession._id, volunteer._id)
				.then(function(response) {
					$scope.search.value = "";
					$scope.results = null;
					$scope.updateRecords();
				})
				.catch(function(error) {
					$scope.error = true;
					$scope.errorMessage = error.message;
				});
			}
		};

		// Filter to ensure that volunteers shown are not already participating.
		$scope.filterAlreadyParticipating = function(volunteer) {
			for(var i = 0; i < $scope.currentSession.records.length; i++) {
				if($scope.currentSession.records[i].volunteerID._id == volunteer._id) {
					return false;
				}
			}
			return true;
		}

		// Refresh records
		$scope.updateRecords = function() {
			if($scope.currentSession) {
				databaseService.getRecordsBySession($scope.currentSession._id)
				.then(function(records) {
					$scope.currentSession.records = records;
				})
				.catch(function(error) {
					$scope.error = true;
					$scope.errorMessage = error.message;
				});
			}
		};

		// Updates record 
		$scope.updatePresent = function(record) {
			databaseService.updateRecordByID(record._id, record)
			.then(function(response) {
				console.log(response);
			})
			.catch(function(error) {
				$scope.error = true;
				$scope.errorMessage = error.message;
			});
		};

		// Remove Volunteer if click X
		$scope.removeVolunteer = function(record) {
			databaseService.removeRecord(record)
			.then(function(repsonse) {
				$scope.updateRecords();
			})
			.catch(function(error) {
				$scope.error = true;
				$scope.errorMessage = error.message;
			})
		}

		// Create Volunteer
		$scope.createVolunteer = function(volunteer) {
			databaseService.createVolunteer(volunteer)
			.then(function(response) {
				$scope.selectResult(response.data);
			})
			.catch(function(error) {
				$scope.error = true;
				$scope.errorMessage = error.message;
			})
		}

		// Creates Register Volunteer Modal
		$scope.openVolunteerModal = function() {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'registerVolunteerTemplate.html',
				controller: 'volunteerModalCtrl',
			});

			modalInstance.result.then(function(volunteer) {
				$scope.createVolunteer(volunteer);
			});
		}

		// Create New Session Modal
		$scope.createSessionModal = function() {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'createSessionTemplate.html',
				controller: 'sessionModalCtrl',
			});

			modalInstance.result.then(function(session) {
				session.programID = $routeParams.programID;
				$scope.createSession(session);
			});
		}

		// Edit Session Date
		$scope.changeDate = function() {
			$scope.editing = true;
			$scope.time.old = $scope.time.readable;
			focus('changeDate');
		}

		// When finished editing date
		$scope.makeChanges = function() {
			if(!($scope.time.old == $scope.time.readable)) {
				if(isDate($scope.time.readable)) {
					$scope.currentSession.time = new Date($scope.time.readable).toISOString();
					databaseService.updateSession($scope.currentSession._id, $scope.currentSession)
					.then(function(response){
						// Update Current Session
						getCurrentSession(function() {
							// Update Records for the updated session
							$scope.updateRecords();
						});
					})
					.catch(function(error) {
						$scope.error = true;
						$scope.errorMessage = error.message;
					});
				}
			}
			$scope.editing = false;
		}

		var isDate = function(date) {
		    return ( (new Date(date) !== "Invalid Date" && !isNaN(new Date(date)) ));
		}
}]);

angular.module('myApp').controller('volunteerModalCtrl',
	['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
	
	// Init Form Volunteers
	$scope.volunteer = {
		name: "",
		email: "",
		phone: "",
		remarks: ""
	};

	$scope.volunteerFormError = false;

	$scope.submit = function() {
		$uibModalInstance.close($scope.volunteer);
	}

	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
}]);

angular.module('myApp').controller('sessionModalCtrl',
	['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
	
	// Init Form Volunteers
	$scope.session = {
		programID: "",
		formTime: "",
		time: "",
	};

	$scope.sessionFormError = false;
	$scope.sessionFormErrorMessage = "";

	var isDate = function(date) {
		if(toDate(date) == null) {
			return false;
		}
	    return ( (toDate(date) !== "Invalid Date" && !isNaN(toDate(date)) ));
	}

	var toDate = function(date) {
		// 0123456789 12345
		// 30/07/2016 16:00
		var day = date.substring(0,2);
		var month = date.substring(3,5);
		var year = date.substring(6,10);
		var hour = date.substring(11,13);
		var minute = date.substring(14,16);
		
		if(day > 31 || month > 12 || hour > 24 || minute > 60) {
			return null;
		} else {
			return new Date(year, month, day, hour, minute);
		}
	}

	$scope.submit = function() {
		var date = toDate($scope.session.formTime);

		if(isDate($scope.session.formTime)) {
			if(date.getTime() > new Date().getTime()) {
				$scope.session.time = toDate($scope.session.formTime).toISOString();
				$uibModalInstance.close($scope.session);
			} else {
				$scope.sessionFormError = true;
				$scope.sessionFormErrorMessage = "The specified date is not in the future";
			}
		} else {
			$scope.sessionFormError = true;
			$scope.sessionFormErrorMessage = "Please enter a valid date in the format specified (DD/MM/YYYY HH:MM)"
		}
	}

	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
}]);