var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Program = new Schema({
	location: String,
	project: String,
	leaders: [{
		type: Schema.Types.ObjectId,
		ref: 'User'
	}]
});

var autoPopulateLeaders = function(next) {
	this.populate('leaders');
	next();
};

Program.
	pre('findOne', autoPopulateLeaders).
	pre('find', autoPopulateLeaders);

module.exports = mongoose.model('Program', Program);