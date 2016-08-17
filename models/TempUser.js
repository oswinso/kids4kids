// User model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Rand-Token for random token generation
var randtoken = require('rand-token');

// Nodemailer for sending mail
var nodemailer = require('nodemailer');

var TempUser = new Schema({
	name: String,
	email: String,
	telephone: String,
	token: String,
	timestamp: { type: Date, default: Date.now }
});

TempUser.statics.invite = function(tempUser, cb) {
	console.log(tempUser.email);
	this.findOne({ email: "oswinso@gmail.com"}, function(err, existingUser) {
		if(err) { return cb(err); }

		if(existingUser) {
			return cb("User already exists");
		}

		tempUser.generateToken(function(err, tempUser) {
			if (err) { return cb(err); }

			tempUser.save(function(err) {
				if (err) {
					return cb(err);
				}

				tempUser.sendEmail(function(err) {
					if (err) { return cb(err); }

					cb(null, tempUser);
				})
			})
		})
	})
};

TempUser.methods.sendEmail = function(cb) {
	var url = 'http://localhost:3000/#/register/'+ this.token;

	// Create reusable transporter object using default SMTP transport
	var transporter = nodemailer.createTransport('smtps://nitenoob%40gmail.com:24301443@smtp.gmail.com');

	// setup email data
	var mailOptions = {
		// from: '"Kids4Kids Noreply" <noreply@kids4kids.com>', // Sender address
		from: '"noreply" <nitenoob@gmail.com>', // Temp
		to: this.email, // Receiver
		subject: 'Test',
		text: 'You have been invited to the checkin app. Confirm your account by clicking the following link: '+url,
		html: 'Click <a href="'+url+'"> here </a> to confirm your acccount for the checkin app'
	};

	// Send mail
	transporter.sendMail(mailOptions, function(error, info) {
		if(error) { return cb(error)};

		cb(null);
	})
};

TempUser.methods.generateToken = function(cb) {
	// Generate 16 character alpha-numeric token
	var token = randtoken.generate(16);

	this.token = token;
	cb(null, this);
}

module.exports = mongoose.model('TempUser', TempUser);