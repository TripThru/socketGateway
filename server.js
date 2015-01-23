var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var socket = require('./src/socket');
var store = require('./src/store/store');
var tripsController = require('./src/controller/trips');
var quotesController = require('./src/controller/quotes');
var usersController = require('./src/controller/users');
var jobQueue = require('./src/workers/job_queue');
var tripsJobQueue = require('./src/workers/trips');
var quotesJobQueue = require('./src/workers/quotes');
var dashboard = require('./src/routes/dashboard');

store.clear();
jobQueue.clear();

// Init and inject dependencies to avoid circular dependencies
tripsController.init(socket);
quotesController.init(socket);
usersController.init(socket);
tripsJobQueue.init(socket, quotesJobQueue);
quotesJobQueue.init(socket, tripsJobQueue);

var app = express();

app.set('port', process.env.PORT || config.port);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.text());

app.all('*', function(req, res, next){
	res.header("Access-Control-Allow-Origin", '*');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Method", "GET,PUT,POST,DELETE,HEAD,OPTIONS");
	next();
});

app.get('/stats', function(req, res) {
  dashboard
    .getStats(req.query.token)
    .then(function(response){
      res.json(response);
    });
});
app.get('/trips/:status', function(req, res) {
  dashboard
    .getTripsList(req.query.token, req.params.status)
    .then(function(response){
      res.json(response);
    });
});
app.get('/tripstatus/:id', function(req, res) {
  dashboard
    .getTripStatus(req.query.token, req.params.id)
    .then(function(response){
      res.json(response);
    });
});
app.get('/triproute/:id', function(req, res){
  dashboard
    .getTripRoute(req.query.token, req.params.id)
    .then(function(response){
      res.json(response);
    });
});
app.get('/networks', function(req, res) {
  dashboard
    .getNetworks(req.query.token)
    .then(function(response){
      res.json(response);
    });
});
app.get('/log/:id', function(req, res) {
  dashboard
    .getTripLogs(req.query.token, req.params.id)
    .then(function(response){
      res.json(response);
    });
});

var server = app.listen(app.get('port'), function (){
	console.log("server listening on port " + app.get('port'));
	socket.io.attach(server);
});
