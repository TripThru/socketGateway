//require('blocked')(function(ms){console.log('blocked for %sms', ms)});
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config');
var socket = require('./socket');
var store = require('./src/store/store');
store.init(config.db);
var tripsController = require('./src/controller/trips');
var quotesController = require('./src/controller/quotes');
var usersController = require('./src/controller/users');
var networksGateway = require('./src/networks_gateway');
var jobQueue = require('./src/workers/job_queue');
var tripsJobQueue = require('./src/workers/trips');
var dashboard = require('./src/routes/dashboard');
var activeTrips = require('./src/active_trips');
var activeTripPayments = require('./src/active_trip_payments');
var activeQuotes = require('./src/active_quotes');
var tripRoutes = require('./src/routes/trips');
var quoteRoutes = require('./src/routes/quotes');
var userRoutes = require('./src/routes/users');
var swagger = require('./swagger/swagger');

activeQuotes.clear();
activeTripPayments.clear();
activeTrips.clear();
jobQueue.clear();
store.clear();

//Init and inject dependencies to avoid circular dependencies
tripsController.init(networksGateway);
quotesController.init(networksGateway);
usersController.init(networksGateway);
tripsJobQueue.init(networksGateway);

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

// API routes
app.post('/network', function(req, res){
  userRoutes
    .setNetworkInfo(req.query.token, req.body)
    .then(function(response){
      res.json(response);
    });
});
app.get('/network/:id', function(req, res){
  userRoutes
    .getNetworkInfo(req.query.token, req.params.id)
    .then(function(response){
      res.json(response);
    });
});
app.get('/drivers', function(req, res){
  userRoutes
    .getDriversNearby(req.query.token, req.body)
    .then(function(response){
      res.json(response);
    });
});
app.get('/quote/:id', function(req, res){
  quoteRoutes
    .getQuote(req.query.token, req.params.id, req.body)
    .then(function(response){
      res.json(response);
    });
});
app.post('/trip/:id', function(req, res){
  tripRoutes
    .dispatchTrip(req.query.token, req.params.id, req.body)
    .then(function(response){
      res.json(response);
    });
});
app.put('/tripstatus/:id', function(req, res){
  tripRoutes
    .updateTripStatus(req.query.token, req.params.id, req.body)
    .then(function(response){
      res.json(response);
    });
});
app.get('/tripstatus/:id', function(req, res){
  tripRoutes
    .getTripStatus(req.query.token, req.params.id)
    .then(function(response){
      res.json(response);
    });
});
app.post('/payment/:id', function(req, res){
  tripRoutes
    .requestPayment(req.query.token, req.params.id, req.body)
    .then(function(response){
      res.json(response);
    });
});
app.put('/payment/:id', function(req, res){
  tripRoutes
    .acceptPayment(req.query.token, req.params.id, req.body)
    .then(function(response){
      res.json(response);
    });
});

// Dashboard routes
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
app.get('/triproute/:id', function(req, res){
  dashboard
    .getTripRoute(req.query.token, req.params.id)
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

swagger.init(app);
var server = app.listen(app.get('port'), function (){
  console.log("server listening on port " + app.get('port'));
  socket.io.attach(server);
});
