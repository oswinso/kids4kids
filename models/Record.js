var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Record = new Schema({
	sessionID: {
		type: Schema.Types.ObjectId,
		ref: 'Session'
	},
	volunteerID: {
		type: Schema.Types.ObjectId,
		ref: 'Volunteer'
	},
	present: {
		type: Boolean,
		default: false
	}
});

var autoPopulateVolunteer = function(next) {
	this.populate('volunteerID');
	next();
};

Record.
	pre('findOne', autoPopulateVolunteer).
	pre('find', autoPopulateVolunteer);

module.exports = mongoose.model('Record', Record);