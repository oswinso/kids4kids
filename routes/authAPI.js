var express = require('express');
var router = express.Router();
var passport = require('passport');
var mongoose = require('mongoose');

var TempUser = mongoose.model('TempUser');

var User = mongoose.model('User');

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

// Register User
router.post('/register', function(req,res) {
	User.register(new User({
		username: req.body.username,
		name: req.body.name,
		phone: req.body.phone,
		email: req.body.email,
		admin: req.body.admin
	}),
		req.body.password, function(err, account) {
		if(err) {
			return res.status(500).json({
				err: err
			});
		}
		passport.authenticate('local')(req, res, function() {
			return res.status(200).json({
				status: 'Registration successful!'
			});
		});
	});
});

// Invite User
router.post('/invite', ensureAdmin, function(req, res) {
	TempUser.invite(new TempUser({ name: req.body.name, email: req.body.email, phone: req.body.phone }), function(err, tempUser) {
		if(err) {
			console.log("Error: ");
			console.log(err);
			return res.status(500).json({
				err: err
			});
		}
		return res.status(200).json({
			status: 'Invite Successful!'
		});
	});
});

// Get user from invite code
router.get('/invite/:token', function(req, res) {
	TempUser.findOne({ token: req.params.token }, function(err, tempUser) {
		if(err) {
			return res.status(500).json({
				err: err
			});
		}
		return res.status(200).json(tempUser);
	});
});

// Remove user using invite code
router.delete('/invite/:token', function(req, res) {
	TempUser.remove({ token: req.params.token }, function(err) {
		if(err) {
			return res.status(404).json({
				err: err
			});
		}
		return res.status(200).json({
			status: 'Delete Successful!'
		});
	});
});

router.post('/login', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if(err) {
			return next(err);
		}
		if(!user) {
			return res.status(401).json({
				err: info
			});
		}
		req.logIn(user, function(err) {
			if(err) {
				return res.status(500).json({
					err: 'Could not log in user'
				});
			}
			if(req.user.admin) {
				res.status(200).json({
					status: 'Login successful!',
					admin: true
				});
			} else {
				res.status(200).json({
					status: 'Login successful!'
				});
			}
		});
	})(req, res, next);
});

router.get('/logout', function(req, res) {
	req.logout();
	res.status(200).json({
		status: 'Logout successful'
	});
});

// Returns user status of currently logged in user (admin/logged in/not logged in)
router.get('/status', function(req, res) {
	if (!req.isAuthenticated()) {
		return res.status(200).json({
			status: false
		});
	} else if(req.user.admin) {
		res.status(200).json({
			status: true,
			admin: true
		});
	} else {
		res.status(200).json({
			status: true
		});
	}
});

// Lists all users
router.get('/listUsers', ensureAdmin, function(req, res) {
	User.find().lean().exec(function(err, users) {
		if(err) {
			return res.status(400).json(err);
		}
		res.status(200).json(users);
	});
});

// List all temp users
router.get('/listTempUsers', ensureAdmin, function(req, res) {
	TempUser.find().exec(function(err, users) {
		if(err) {
			return res.status(400).json(err);
		}
		res.status(200).json(users);
	});
});

router.post('/resendConfirmation', ensureAdmin, function(req, res) {
	console.log("In Resend");
	// Get user from email
	TempUser.findOne({ email: req.body.email }, function(err, tempUser) {
		// If it has been more than 12 hours
		if(Date.now() > tempUser.timestamp.getTime() + (12*60*60*1000)) {
			// Resend confirmation
			console.log("Sending Email");
			tempUser.sendEmail(function(err) {
				if(err) {
					return res.status(400).json(err);
				}
				console.log("Sent Email");
				tempUser.timestamp = new Date();
				tempUser.markModified('timestamp');
				tempUser.save(function(err) {
					if(err) {
						return res.status(400).json(err);
					}
					res.status(200).json({
						status: 'Success'
					});
				});
			})
		} else {
			return res.status(403).json({err: "Cannot resend confirmation"});
		}
	})
})

module.exports = router;
