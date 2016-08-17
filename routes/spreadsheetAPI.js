var express = require('express');
var router = express.Router();
var spreadsheetController = require('../controllers/spreadsheet')

// List programs
router.post('/visitor', function(req, res) {
	spreadsheetController.saveVisitor(req.body, function(err, response) {
		if(err) {
			res.status(400).send(err);
		} else {
			res.status(200).json(response);
		}
	});
});

module.exports = router;