var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Volunteer = new Schema({
	name: String,
	email: String,
	phone: String,
	remarks: String
});

module.exports = mongoose.model('Volunteer', Volunteer);