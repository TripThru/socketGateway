var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var socket = require('./src/socket');
var tripsController = require('./src/controller/trips');
var quotesController = require('./src/controller/quotes');
var usersController = require('./src/controller/users');
var tripsJobQueue = require('./src/workers/trips');
var quotesJobQueue = require('./src/workers/quotes');
var activeTripsTracker = require('./src/active_trips_tracker');
var codes = require('./src/codes');
var resultCodes = codes.resultCodes;
var logger = require('./src/logger');

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


//Move this functions to routes
app.get('/stats', function(req, res) {
  var stats = activeTripsTracker.getStats();
  stats.result = resultCodes.ok;
  res.json(stats);
});
app.get('/trips/:status', function(req, res) {
  var status = req.params.status;
  var trips = activeTripsTracker.getDashboardTrips(status);
  var response = {
      trips: trips,
      result: resultCodes.ok
  }
  res.json(response);
});
app.get('/tripstatus/:tripId', function(req, res) {
  var id = req.params.tripId;
  tripsController.getTripStatus({id: id}, function(response){
    response.result = resultCodes.ok;
    res.json(response);
  });
});
app.get('/triproute/:tripId', function(req, res){
  var id = req.params.tripId;
  var response;
  var trip;
  try {
    trip = activeTripsTracker.getTrip({id: id});
    response = {
      historyEnrouteList: trip.driver.enrouteLocation,
      historyPickUpList: trip.driver.pickupLocation,
      result: resultCodes.ok
    };
  } catch(err) {
    response = {};
  }
  console.log(trip);
  res.json(response);
});
app.get('/networks', function(req, res) {
  usersController.getNetworks(function(response){
    response.result = resultCodes.ok;
    res.json(response);
  });
});
app.get('/log/:tripId', function(req, res) {
  var id = req.params.tripId;
  var logs = id !== 'all' ? logger.getLogsById(id) : logger.getLogs();
  var response = {
    result: resultCodes.ok,
    logs: logs
  };
  res.json(response);
});

var server = app.listen(app.get('port'), function (){
	console.log("server listening on port " + app.get('port'));
	socket.io.attach(server);
});
