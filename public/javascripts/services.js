angular.module('myApp').factory('AuthService',
	['$q', '$timeout', '$http',
	function($q, $timeout, $http) {
		// Create user variable
		var user = null;

		// Return available functions for use in the controllers
		return ({
			isLoggedIn: isLoggedIn,
			getUserStatus: getUserStatus,
			login: login,
			logout: logout,
			register: register
		});

		function isLoggedIn() {
			if(user) {
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

		function register(username, password) {
			// Create new instance of deferred
			var deferred = $q.defer();

			$http.post('/user/register',
				{username: username, password: password})
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
	}])
	.factory('databaseService',
		['$q', '$timeout', '$http',
		function($q, $timeout, $http) {
			// Return available functions for use in the controllers
			return ({
				getPrograms: getPrograms,
				getSessions: getSessions,
				getProgramByID: getProgramByID,
				getVolunteersByName: getVolunteersByName,
				addVolunteerToSession: addVolunteerToSession,
				getRecordsBySession: getRecordsBySession,
				updateRecordByID: updateRecordByID,
				removeRecord: removeRecord,
				createVolunteer: createVolunteer,
				updateSession: updateSession
			});

			function getPrograms(options) {
				// Create new instance of deferred
				var deferred = $q.defer();

				console.log("options: ");
				console.log(options);
				$http({
					url: '/database/programs',
					method: 'GET',
					params: options
				})
				// Handle Success
				.success(function(data) {
					console.log("data: ");
					console.log(data);
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
					console.log("data: ");
					console.log(data);
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