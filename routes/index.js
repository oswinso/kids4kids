var express = require('express');
var spreadsheetController = require('../controllers/spreadsheet');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index');
});

router.get('/visitor', function(req, res) {
	res.redirect('/');
});

router.post('/visitor', spreadsheetController.saveVisitor);

router.get('/ping', function(req, res) {
	res.status(200).send("pong!");
});

module.exports = router;
