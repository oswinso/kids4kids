var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Session = new Schema({
	programID: {
		type: Schema.Types.ObjectId,
		ref: 'Program'
	},
	time: Date,
	records: [{
		type: Schema.Types.ObjectId,
		ref: 'Record'
	}]
});

var autoPopulateRecord = function(next) {
	this.populate('records');
	next();
};

Session.
	pre('findOne', autoPopulateRecord).
	pre('find', autoPopulateRecord);

module.exports = mongoose.model('Session', Session);