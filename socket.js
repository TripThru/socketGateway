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

var monitorio = require('monitor.io');
io.use(monitorio({ port: 3304}));

//authentication middleware
io.use(function(socket, next){
  var query = socket.handshake.query;

  if (!query || !query.token) {
    console.log("Invalid connection attempt");
    next(new Error('Invalid access token'));
  } else {
    users
      .getByToken(query.token)
      .then(function(user){
        if (user && user.role === 'network') {
          console.log(query.replace)
          if(!networksGateway.hasSocketNetwork(user.clientId) || query.replace === 'true') {
            var socketGateway = new SocketGateway(user.clientId, socket, io);
            if(query.replace === 'true' && networksGateway.hasSocketNetwork(user.clientId)) {
              console.log(user.clientId + ' replacing connection');
              networksGateway.unsubscribeSocketGateway(user.clientId);
              activeSocketsByClientId[user.clientId].disconnect();
            }
            networksGateway.subscribeSocketGateway(socketGateway);
            activeSocketsByClientId[user.clientId] = socket;
            activeClientIdsBySocket[socket] = user.clientId;
            socket.disconnectClient = disconnectClient;
            next();
          } else {
            console.log(user.clientId + ' tried to connect again without replace=true.');
            next(new Error('You already have an opened connection. ' + 
                'To override it add replace=true to connection query.'));
          }
        } else {
          next(new Error('Invalid access token'));
          console.log("Invalid access token");
        }
      });
  }
});

io.sockets.on('connection', function (socket){
  var token = socket.handshake.query.token;
  console.log('Client connected', token);

  socket.monitor('clientId', activeClientIdsBySocket[socket]);
  socket.monitor('connectedAt', new Date());
  
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
    disconnectClient(socket);
  });
});

function disconnectClient(socket) {
  var id = activeClientIdsBySocket[socket];
  delete activeSocketsByClientId[id];
  delete activeClientIdsBySocket[socket];
  networksGateway.unsubscribeSocketGateway(id);
  socket.disconnect();
  console.log('Client disconnected', id);
}

function getClientId(socket) {
  return activeClientIdsBySocket[socket];
}

io.disconnectClient = disconnectClient;

module.exports.io = io;