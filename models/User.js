// User model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');


var User = new Schema({
	username: String,
	name: String,
	password: String,
	email: String,
	telephone: String,
	programs: [{
		type: Schema.Types.ObjectId,
		ref: 'Program'
	}],
	admin: { type: Boolean, default: false }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);