var myApp = angular.module('myApp', ['ngRoute', 'ui.bootstrap']);

myApp.config(function($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: '/partials/home.html',
			access: {restricted: true}
		})
		.when('/login', {
			templateUrl: 'partials/login.html',
			controller: 'loginController',
			access: {restricted: false}
		})
		.when('/logout', {
			controller: 'logoutController',
			access: {restricted: true}
		})
		.when('/register', {
			templateUrl: 'partials/register.html',
			controller: 'registerController',
			access: {restricted: true}
		})
		.when('/dashboard', {
			templateUrl: 'partials/dashboard.html',
			controller: 'dashboardController',
			access: {restricted: true}
		})
		.when('/admin', {
			templateUrl: 'partials/admin.html',
			access: {restricted: true}
		})
		.when('/programs/:programID/:sessionID?', {
			templateUrl: 'partials/program.html',
			controller: 'programController',
			access: {restricted: true}
		})
		.when('/users', {
			templateUrl: 'partials/user.html',
			controller: 'usersController',
			access: {restricted: true}
		})
		.when('/statistics', {
			templateUrl: 'partials/statistics.html',
			controller: 'statisticsController',
			access: {restricted: true}
		})
		.when('/register/:token', {
			templateUrl: 'partials/register.html',
			controller: 'registerController',
			access: {restricted: false}
		})
		.otherwise({
			redirectTo: '/'
		})
});

myApp.run(function ($rootScope, $location, $route, AuthService) {
$rootScope.$on('$routeChangeStart',
	function (event, next, current) {
		AuthService.getUserStatus()
		.then(function() {
			if(next.access && next.access.restricted && !AuthService.isLoggedIn()) {
				$location.path('/login');
				$route.reload();
			}
		});
	});
});