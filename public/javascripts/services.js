angular.module('myApp').factory('AuthService',
	['$q', '$timeout', '$http',
	function($q, $timeout, $http) {
		// Create user variable
		var user = null;
		var admin = false;

		// Return available functions for use in the controllers
		return ({
			isLoggedIn: isLoggedIn,
			isAdmin: isAdmin,
			getUserStatus: getUserStatus,
			login: login,
			logout: logout,
			register: register,
			listAll: listAll
		});

		function isLoggedIn() {
			if(user) {
				return true;
			} else {
				return false;
			}
		}

		function isAdmin() {
			if(admin) {
				return true;
			} else {
				return false;
			}
		}

		function getUserStatus() {
			return $http.get('/user/status')
			// handle success
			.success(function (data) {
				if(data.status){
					user = true;
					if(data.admin) {
						admin = true;
					} else {
						admin = false;
					}
				} else {
					user = false;
				}
			})
			// handle error
			.error(function(data) {
				user = false;
			});
		}

		function login(username, password) {
			// Create new instance of deferred
			var deferred = $q.defer();

			$http.post('/user/login',
				{username: username, password: password})
				// Handle Success
				.success(function(data, status) {
					if(status === 200 && data.status) {
						user = true;
						if(data.admin) {
							admin = true;
						} else {
							admin = false;
						}
						deferred.resolve();
					} else {
						user = false;
						deferred.reject();
					}
				})
				.error(function(data) {
					user = false;
					deferred.reject();
				});

			// Return promise object
			return deferred.promise;
		}

		function logout() {
			// Create new instance of deferred
			var deferred = $q.defer();

			$http.get('/user/logout')
				// handle success
				.success(function(data) {
					user = false;
					deferred.resolve();
				})
				// Handle error
				.error(function(data) {
					user = false;
					deferred.reject();
				});

			// Return promise object
			return deferred.promise;
		}

		function register(username, name, password, email, phone) {
			// Create new instance of deferred
			var deferred = $q.defer();

			$http.post('/user/register',
				{username: username,name: name, password: password, email: email, phone : phone})
			// Handle success
			.success(function(data, status) {
				if(status === 200 && data.status) {
					deferred.resolve();
				} else {
					deferred.reject();
				}
			})
			.error(function(data) {
				deferred.reject();
			});

			// Return promise object
			return deferred.promise;
		}

		function listAll() {
			var deferred = $q.defer();

			$http.get('/user/listUsers')
			.success(function(users) {
				deferred.resolve(users);
			})
			.error(function(err) {
				deferred.reject(err);
			});

			return deferred.promise;
		}
	}])
	.factory('databaseService',
		['$q', '$timeout', '$http',
		function($q, $timeout, $http) {
			// Return available functions for use in the controllers
			return ({
				getPrograms: getPrograms,
				getSessions: getSessions,
				getProgramByID: getProgramByID,
				createProgram: createProgram,
				modifyProgram: modifyProgram,
				deleteProgram: deleteProgram,

				getVolunteersByName: getVolunteersByName,
				addVolunteerToSession: addVolunteerToSession,
				getRecordsBySession: getRecordsBySession,
				updateRecordByID: updateRecordByID,
				removeRecord: removeRecord,
				createVolunteer: createVolunteer,
				updateSession: updateSession,
				createSession: createSession,

				getProgramByIDs: getProgramByIDs,

				addProgramToUser: addProgramToUser,
				removeProgramFromUser: removeProgramFromUser,

				
			});

			function getPrograms() {
				// Create new instance of deferred
				var deferred = $q.defer();
				$http({
					url: '/database/programs',
					method: 'GET'
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function getProgramByID(id) {
				// Create new instance of deferred
				var deferred = $q.defer();
				$http({
					url: '/database/programs/'+id,
					method: 'GET'
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			// Create Program
			function createProgram(program) {
				// Create new instance of deferred
				var deferred = $q.defer();
				$http({
					url: '/database/program',
					method: 'POST',
					data: program
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			// Returns programs by array of IDs.
			function getProgramByIDs(ids) {
				// Create new instance of deferred
				console.log("IDs");
				console.log(ids);
				var deferred = $q.defer();
				$http({
					url: '/database/programs/',
					method: 'POST',
					data: {
						ids: ids
					}
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			// Add program to user
			function addProgramToUser(userID, programID) {
				var deferred = $q.defer();
				$http({
					url: '/database/addProgramToUser/',
					method: 'POST',
					data: { userID: userID, programID: programID }
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			// Add program to user
			function removeProgramFromUser(userID, programID) {
				var deferred = $q.defer();
				$http({
					url: '/database/removeProgramFromUser/',
					method: 'POST',
					data: { userID: userID, programID: programID }
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function modifyProgram(program) {
				var deferred = $q.defer();
				$http({
					url: '/database/programs/'+program._id,
					method: 'PUT',
					data: { program: program }
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function deleteProgram(program) {
				var deferred = $q.defer();
				$http({
					url: '/database/programs/'+program._id,
					method: 'DELETE'
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function getSessions(options) {
				// Create new instance of deferred
				var deferred = $q.defer();

				$http({
					url: '/database/sessions',
					method: 'GET',
					params: options
				})
				// Handle Success
				.success(function(data) {
					deferred.resolve(data);
				})
				// Handle Error
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function getVolunteersByName(name) {
				// Create new instance of deferred
				var deferred = $q.defer();

				$http({
					url: '/database/volunteers/name/'+name,
					method: 'GET'
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function addVolunteerToSession(sessionID, volunteerID) {
				// Create new instance of deferred
				var deferred = $q.defer();

				$http({
					url: '/database/sessions/'+sessionID+'/volunteer/'+volunteerID,
					method: 'POST'
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function getRecordsBySession(sessionID) {
				// Create new instance of deferred
				var deferred = $q.defer();

				$http({
					url: '/database/records/sessionID/'+sessionID,
					method: 'GET'
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function updateRecordByID(recordID, record) {
				console.log("Running updateRecordByID");
				// Create new instance of deferred
				var deferred = $q.defer();

				$http({
					url: '/database/record/'+recordID,
					method: 'PUT',
					data: {
						record: record
					}
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function removeRecord(record) {
				var deferred = $q.defer();

				$http({
					url: '/database/record/'+record._id,
					method: 'DELETE',
					data: {
						record: record
					}
				})
				.success(function(data) {
					console.log("Done!");
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			function createVolunteer(volunteer) {
				var deferred = $q.defer();

				$http({
					url: '/database/volunteers',
					method: 'POST',
					data: volunteer
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			// Updates the session with sessionID with the session object provided
			function updateSession(sessionID, session) {
				var deferred = $q.defer();

				$http({
					url: '/database/session/'+sessionID,
					method: 'PUT',
					data: session
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}

			// Creates a new session
			function createSession(session) {
				var deferred = $q.defer();

				$http({
					url: '/database/sessions/',
					method: 'POST',
					data: session
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				return deferred.promise;
			}

	}])
	.factory('registrationService',
		['$q', '$timeout', '$http',
		function($q, $timeout, $http) {
			// Return available functions for use in the controllers
			return ({
				inviteUser: inviteUser,
				getUser: getUser,
				removeUser: removeUser,
				listAll: listAll,
				resendConfirmation: resendConfirmation
			});

			// Invite new user (volunteer leader)
			function inviteUser(newUser) {
				var deferred = $q.defer();

				var data = ({
					name : newUser.name,
					email : newUser.email,
					phone : newUser.phone
				});

				console.log("2");
				console.log(newUser);

				$http({
					url: '/user/invite',
					method: 'POST',
					data: data
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				return deferred.promise;
			}

			// Gets user information from token
			function getUser(token) {
				var deferred = $q.defer();

				$http({
					url: '/user/invite/'+token,
					method: 'GET'
				})
				.success(function(user) {
					deferred.resolve(user);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				return deferred.promise;
			}

			// Deletes user from tempUser after success
			function removeUser(token) {
				var deferred = $q.defer();

				$http({
					url: '/user/invite/'+token,
					method: 'DELETE'
				})
				.success(function() {
					deferred.resolve();
				})
				.error(function(error) {
					deferred.reject(error);
				});

				return deferred.promise;
			}

			// Lists all tempUsers
			function listAll() {
				var deferred = $q.defer();

				$http.get('/user/listTempUsers')
				.success(function(users) {
					deferred.resolve(users);
				})
				.error(function(err) {
					deferred.reject(err);
				});

				return deferred.promise;
			}

			// Resend Confirmation
			function resendConfirmation(email) {
				var deferred = $q.defer();

				$http({
					url: '/user/resendConfirmation',
					method: 'POST',
					data: { email: email }
				})
				.success(function() {
					deferred.resolve();
				})
				.error(function(err) {
					deferred.reject(err);
				});

				return deferred.promise;
			}
	}])
	.factory('spreadsheetService',
		['$q', '$timeout', '$http',
		function($q, $timeout, $http) {
			// Return available functions for use in the controllers
			return ({
				logVisitor: logVisitor
			});

			function logVisitor(visitor) {
				var deferred = $q.defer();

				$http({
					url: '/visitor',
					method: 'POST',
					data: visitor
				})
				.success(function(data) {
					deferred.resolve(data);
				})
				.error(function(error) {
					deferred.reject(error);
				});

				// Return promise object
				return deferred.promise;
			}
	}])
	.factory('focus', function($timeout, $window) {
		return function(id) {
		// timeout makes sure that it is invoked after any other event has been triggered.
		// e.g. click events that need to run before the focus or
		// inputs elements that are in a disabled state but are enabled when those events
		// are triggered.
		$timeout(function() {
			var element = $window.document.getElementById(id);
			if(element)
				element.focus();
			});
		};
	});