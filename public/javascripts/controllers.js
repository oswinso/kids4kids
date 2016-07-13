angular.module('myApp').controller('loginController',
	['$scope', '$location', 'AuthService',
	function($scope, $location, AuthService) {
		$scope.login = function() {
			// Initial Values
			$scope.error = false;
			$scope.disabled = true;

			// Call login from service
			AuthService.login($scope.loginForm.username, $scope.loginForm.password)
				// handle success
				.then(function() {
					$location.path('/dashboard');
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
}]);

angular.module('myApp').controller('logoutController',
	['$scope', '$location', 'AuthService',
	function($scope, $location, AuthService) {
		$scope.logout = function() {
			// Call logout from service
			AuthService.logout()
			.then(function() {
				$location.path('/login');
			});
		};
}]);

angular.module('myApp').controller('registerController',
	['$scope', '$location', 'AuthService',
	function($scope, $location, AuthService) {
		$scope.register = function() {

			// Initial Values
			$scope.error = false;
			$scope.disabled = true;

			AuthService.register($scope.registerForm.username, $scope.registerForm.password)
			// handle success
			.then(function() {
				$location.path('/login');
				$scope.disabled = false;
				$scope.registerForm = {};
			})
			// handle error
			.catch(function() {
				$scope.error = true;
				$scope.errorMessage = "Something went wrong while registering";
				$scope.disabled = false;
				$scope.registerForm = {};
			});
		};
}]);

angular.module('myApp').controller('dashboardController',
	['$scope', '$location', 'databaseService', 'AuthService',
	function($scope, $location, databaseService, AuthService) {
		// Initial Values
		$scope.error = false;
		console.log("hi");

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
}]);

angular.module('myApp').controller('programController',
	['$scope', '$routeParams', 'socket', 'databaseService', 'AuthService', '$uibModal',
	function($scope, $routeParams, socket, databaseService, AuthService, $uibModal) {
		// Initialise Variables
		$scope.currentSession = null;
		$scope.searching = false;
		$scope.noResults = true;
		$scope.focus = false;
		$scope.search = {value: ""};
		$scope.errorMessage = "";

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
			$scope.errorMessage = "Cannot find specified session.";
		});

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
				$scope.currentSession = sessions[0];
				console.log("Current Session:");
				console.log($scope.currentSession);
			}
		})
		.catch(function(error) {
			$scope.error = true;
			$scope.errorMessage = "Cannot find specified program.";
		});

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
					console.log("response:");
					console.log(response);
					$scope.updateRecords();
				})
				.catch(function(error) {
					console.log("ERROR!!");
					console.log(error.message);
					$scope.error = true;
					$scope.errorMessage = error.message;
				});
			}
		};

		// Refresh records
		$scope.updateRecords = function() {
			if($scope.currentSession) {
				databaseService.getRecordsBySession($scope.currentSession._id)
				.then(function(records) {
					$scope.currentSession.records = records;
					console.log($scope.currentSession.records);
				})
				.catch(function(error) {
					$scope.error = true;
					$scope.errorMessage = error.message;
				});
			}
		};

		// Updates record 
		$scope.updatePresent = function(record) {
			console.log("Running Update Present");
			console.log($scope.currentSession);
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

		// Creates Modal
		$scope.openModal = function() {
			var modalInstance = $uibModal.open({
				animation: true,
				templateUrl: 'myModalContent.html',
				controller: 'ModalInstanceCtrl',
			});

			modalInstance.result.then(function(volunteer) {
				console.log("Volunteer:");
				console.log(volunteer);
				$scope.createVolunteer(volunteer);
			});
		}
}]);

angular.module('myApp').controller('ModalInstanceCtrl',
	['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
	
	// Init Form Volunteers
	$scope.volunteer = {
		name: "",
		email: "",
		phone: "",
		remarks: ""
	};

	$scope.submit = function() {
		console.log("yeah?");
		$uibModalInstance.close($scope.volunteer);
	}

	$scope.dismissModal = function() {
		$uibModalInstance.dismiss("cancel");
	};
}]);