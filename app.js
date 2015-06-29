var express = require('express'),
  config = require('./config/config'),
  glob = require('glob'),
  mongoose = require('mongoose'),
  https = require('https'),
  fs = require('fs');
  var http = require('http');

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
certification = fs.readFileSync('./config/cert.pem', 'utf8');

var creds = {key: privateKey, cert: certification};
var app = express();
require('./config/express')(app, config);

var httpsServer = https.createServer(creds, app);
httpsServer.listen(config.securePort, function(){
	console.log('HTTPS Server started on port ', config.securePort);
});

// var httpServer = http.createServer(app);
// httpServer.listen(config.port, function(){
// 	console.log('http Server started on port:', config.port);
// })

// app.listen(config.port);

