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

// timestamp, name, hkid, purpose
var data = ["","","",""];
var sheetID = "1GU1JvLbw4AkE9iIqOsTZ_wHupCgADPCEH4owTYQcJ8Y";

module.exports = {
	saveVisitor: function(req, res, next) {
		if(req.body.name.length > 0 && req.body.hkid.length > 0 && req.body.purpose.length > 0 && !req.body.hkid.match(/[a-z]/i)) {
			var now = new Date();
			data[0] = dateFormat(now, "dd/mm/yyyy HH:MM:ss");
			data[1] = req.body.name;
			data[2] = req.body.hkid;
			data[3] = req.body.purpose;
			var authClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null);
			authClient.authorize(function(err, tokens) {
				if (err) {
					console.log(err);
					return;
			  	}
			 //  	drive.files.list({ auth: authClient }, function (err, resp) {
				//     // handle err and response
				//     if (err) {
				//       return console.log(err);
				//     }
				//     console.log(resp);
				// });
			  	updateSheet(authClient);
			  	res.redirect('/');
			});
		}
	}
}

function updateSheet(auth) {
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
				console.log('2 The API returned an error: ' + err);
				return;
			}
			console.log(response);
		});
	});
}