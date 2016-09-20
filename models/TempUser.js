// User model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Rand-Token for random token generation
var randtoken = require('rand-token');

// sendgrid helper
var helper = require('sendgrid').mail;
var sg = require('sendgrid')("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");

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
	// var url = 'https://infinite-oasis-96191.herokuapp.com/#/register/'+ this.token;

	var from_email = new helper.Email('noreply@k4kcheckinapp.com');
	var to_email = new helper.Email(this.email);
	var subject = 'Invitation to Kids4Kids Check In App';
	var content = new helper.Content('text/html', 'Hello, Email!');
	var mail = new helper.Mail(from_email, subject, to_email, content);

	mail.personalizations[0].addSubstitution(new helper.Substitution('-token-', this.token));
	mail.setTemplateId('299f4bd5-b9f7-4b20-b6fd-764e8dc13b4c');

	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: mail.toJSON(),
	});

	sg.API(request, function(error, response) {
		if(error) { return cb(error)};
		cb(null);
	});
};

TempUser.methods.generateToken = function(cb) {
	// Generate 16 character alpha-numeric token
	var token = randtoken.generate(16);

	this.token = token;
	cb(null, this);
}

module.exports = mongoose.model('TempUser', TempUser);