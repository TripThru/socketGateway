var Promise = require('bluebird');
var trips = require('./src/controller/trips');
var quotes = require('./src/controller/quotes');
var users = require('./src/controller/users');
var Gateway = require('./src/gateway').Gateway;
var SocketGateway = require('./src/socket_gateway');
var networksGateway = require('./src/networks_gateway');

var activeSocketsByClientId = {};
var activeClientIdsBySocket = {};
var io = require('socket.io')({
  transports:['websocket']
});

//no need for server to serve client files
io.serveClient(false);

//authentication middleware
io.use(function(socket, next){
  var query = socket.handshake.query;

  if (!query || !query.token) {
    console.log("Invalid connection attempt");
  } else {
    users
      .getByToken(query.token)
      .then(function(user){
        if (user && user.role === 'network') {
          if(!networksGateway.hasNetwork(user.clientId)) {
            var socketGateway = new SocketGateway(user.clientId, socket);
            networksGateway.subscribeNetwork(socketGateway);
            activeSocketsByClientId[user.clientId] = socket;
            activeClientIdsBySocket[socket] = user.clientId;
            next();
          } else {
            console.log(user.clientId + ' already has an open connection');
          }
        } else {
          console.log("Invalid access token");
        }
      });
  }
});

io.sockets.on('connection', function (socket){
  var token = socket.handshake.query.token;
  console.log('Client connected', token);
  
  socket.on('hi', function(msg, cb){
    console.log(msg);
    cb('hi');
  });
  
  // Trips
  socket.on('dispatch-trip', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    trips.dispatchTrip(req).then(cb);
  });
  socket.on('get-trip', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    trips.getTrip(req).then(cb);
  });
  socket.on('get-trip-status', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    trips.getTripStatus(req).then(cb);
  });
  socket.on('update-trip-status', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    trips.updateTripStatus(req).then(cb);
  });
  socket.on('request-payment', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    trips.requestPayment(req).then(cb);
  });
  socket.on('accept-payment', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    trips.acceptPayment(req).then(cb);
  });
  
  //Quotes
  socket.on('get-quote', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    quotes.getQuote(req).then(cb);
  });
  
  //Users
  socket.on('get-network-info', function(req ,cb){
    req.client_id = req.client_id || getClientId(socket, req);
    users.getNetworkInfo(req).then(cb);
  });
  socket.on('set-network-info', function(req, cb){
    req.client_id = req.client_id || getClientId(socket, req);
    users.setNetworkInfo(req).then(cb);
  });
  socket.on('get-drivers-nearby', function(req, cb) {
    req.client_id = req.client_id || getClientId(socket, req);
    users.getDriversNearby(req).then(cb);
  });
  
  socket.on('disconnect', function(){
    var id = activeClientIdsBySocket[socket];
    delete activeSocketsByClientId[id];
    delete activeClientIdsBySocket[socket];
    networksGateway.unsubscribeNetwork(id);
    console.log('Client disconnected', id);
  });
});

function getClientId(socket) {
  return activeClientIdsBySocket[socket];
}

module.exports.io = io;