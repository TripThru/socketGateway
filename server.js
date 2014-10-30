
var express = require('express');
var config = require('./config');
var socket = require('./src/socket');

var app = express();

app.set('port', process.env.PORT || config.port);

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", '*');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Method", "GET,PUT,POST,DELETE,HEAD,OPTIONS");
	next();
});

var server = app.listen(app.get('port'), function () {
	console.log("server listening on port " + app.get('port'));
	socket.io.attach(server);
});

