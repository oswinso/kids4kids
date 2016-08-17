// Dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

// Mongoose Connect
// var dbinfo = require('./dbinfolocal.json');
var dbinfo = require('./dbinforemote.json');
console.log("Connecting to "+dbinfo.path)
mongoose.connect(dbinfo.path)

// user schema/model
var User = require('./models/User.js');
var TempUser = require('./models/TempUser');

// Require Routes
var authAPI = require('./routes/authAPI.js');
var databaseAPI = require('./routes/databaseAPI.js');

// Create instance of express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Define Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
	secret: 'k4k',
	cookie: { maxAge: 60000 },
	saveUninitialized: false,
	resave: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash())
app.use(express.static(path.join(__dirname, 'public')));

// Configure Passport
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.use('/user/', authAPI);
app.use('/database/', databaseAPI);

app.get('/', function(req, res) {
	res.render('index');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
