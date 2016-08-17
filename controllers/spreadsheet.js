var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var dateFormat = require('dateformat');
var drive = google.drive('v2');
var key = require('../key.json');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.readonly'];

// timestamp, name, email, purpose
var data = ["","","",""];
var sheetID = "1GU1JvLbw4AkE9iIqOsTZ_wHupCgADPCEH4owTYQcJ8Y";

module.exports = {
	saveVisitor: function(visitor, callback) {
		var now = new Date();

		// timestamp, name, email, purpose
		var data = ["","","",""];

		data[0] = dateFormat(now, "dd/mm/yyyy HH:MM:ss");
		data[1] = visitor.name;
		data[2] = visitor.email;
		data[3] = visitor.purpose;
		var authClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null);
		authClient.authorize(function(err, tokens) {
			if (err) {
				console.log(err);
				req.flash('info', 'Error');
				return;
		  	}
		  	updateSheet(authClient, data, callback);
		});	
	}
}

function updateSheet(auth, data, callback) {
	var sheets = google.sheets('v4');
	sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: sheetID,
		range: new Date().getFullYear()+'!E1',
	}, function(err, response) {
		if (err) {
			console.log('1 The API returned an error: ' + err);
			console.log(response);
			return;
		}
		var row = response.values[0][0]
		sheets.spreadsheets.values.update({
			auth: auth,
			spreadsheetId: sheetID,
			range: new Date().getFullYear()+'!A'+row+":D",
			valueInputOption: 'USER_ENTERED',
			resource: {
				"range": new Date().getFullYear()+'!A'+row+":D",
				"majorDimension": "ROWS",
				"values": [data],
			}
		}, function(err, response) {
			if (err) {
				callback(err, null);
			} else {
				callback(null, response);
			}
		});
	});
}