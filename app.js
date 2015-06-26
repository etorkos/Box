var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose'),
  https = require('https'),
  fs = require('fs');



//set up backend
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model);
});

//set up server
var privateKey = fs.readFileSync('./config/key.pem', 'utf8'),
cert = fs.readFileSync('./config/cert.pem', 'utf8');

var creds = {key: privateKey, cert: cert};
var httpsServer = https.createServer(creds, app);
httpsServer.listen(8443);


var app = express();
require('./config/express')(app, config);
app.listen(config.port);

