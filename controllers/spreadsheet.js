var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var dateFormat = require('dateformat');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// timestamp, name, hkid, purpose
var data = ["","","",""];
var sheetID = "1GU1JvLbw4AkE9iIqOsTZ_wHupCgADPCEH4owTYQcJ8Y";

module.exports = {
	saveVisitor: function(req, res, next) {
		var now = new Date();
		data[0] = dateFormat(now, "dd/mm/yyyy HH:MM:ss");
		data[1] = req.body.name;
		data[2] = req.body.hkid;
		data[3] = req.body.purpose;
		fs.readFile('client_secret.json', function processClientSecrets(err, content) {
		  if (err) {
			console.log('Error loading client secret file: ' + err);
			return;
		  }
		  // Authorize a client with the loaded credentials, then call the
		  // Google Sheets API.
		  authorize(JSON.parse(content), updateSheet);
		});
		res.redirect('/');
	}
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
function updateSheet(auth) {
	var sheets = google.sheets('v4');
	sheets.spreadsheets.values.get({
		auth: auth,
		spreadsheetId: sheetID,
		range: new Date().getFullYear()+'!E1',
	}, function(err, response) {
		if (err) {
			console.log('1 The API returned an error: ' + err);
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
		});
	});
}