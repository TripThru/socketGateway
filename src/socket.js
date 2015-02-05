var Promise = require('bluebird');
var trips = require('./controller/trips');
var quotes = require('./controller/quotes');
var users = require('./controller/users');
var Gateway = require('./gateway').Gateway;
var partnersGateway = require('./partners_gateway');

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
        if (user && user.role === 'partner') {
          var socketGateway = new SocketGateway(user.id, socket);
          partnersGateway.subscribePartner(socketGateway);
          activeSocketsByClientId[user.id] = socket;
          activeClientIdsBySocket[socket] = user.id;
          next();
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
    trips.dispatchTrip(req).then(cb);
  });
  socket.on('get-trip', function(req, cb){
    trips.getTrip(req).then(cb);
  });
  socket.on('get-trip-status', function(req, cb){
    trips.getTripStatus(req).then(cb);
  });
  socket.on('update-trip-status', function(req, cb){
    trips.updateTripStatus(req).then(cb);
  });
  
  //Quotes
  socket.on('quote-trip', function(req, cb){
    quotes.createQuote(req).then(cb);
  });
  socket.on('get-quote', function(req, cb){
    quotes.getQuote(req).then(cb);
  });
  socket.on('update-quote', function(req, cb){
    quotes.updateQuote(req).then(cb);
  });
  
  //Users
  socket.on('get-partner-info', function(req ,cb){
    users.getPartnerInfo(req).then(cb);
  });
  socket.on('set-partner-info', function(req, cb){
    users.setPartnerInfo(req).then(cb);
  });
  
  socket.on('disconnect', function(){
    var id = activeClientIdsBySocket[socket];
    delete activeSocketsByClientId[id];
    delete activeClientIdsBySocket[socket];
    partnersGateway.unsubscribePartner(id);
    console.log('Client disconnected', id);
  });
});

function appendClientId(socket, request) {
  request.clientId = activeClientIdsBySocket[socket];
  return request;
}

function SocketGateway(id, socket) {
  this.id = id;
  this.socket = socket;
  Gateway.call(this, id, id);
}

SocketGateway.prototype.emit = function(action, data) {
  var socket = this.socket;
  return new Promise(function(resolve, reject){
    socket.emit(action, data, function(res){
      resolve(res);
    });
  });
};

SocketGateway.prototype.dispatchTrip = function(request) {
  return this.emit('dispatch-trip', request);
};

SocketGateway.prototype.getTrip = function(request) {
  return this.emit('get-trip',request);
};

SocketGateway.prototype.getTripStatus = function(request) {
  return this.emit('get-trip-status', request);
};

SocketGateway.prototype.updateTripStatus = function(request) {
  return this.emit('update-trip-status', request);
};

SocketGateway.prototype.quoteTrip = function(request) {
  return this.emit('quote-trip', request);
};

SocketGateway.prototype.getQuote = function(request) {
  return this.emit('get-quote', request);
};

SocketGateway.prototype.updateQuote = function(request) {
  return this.emit('update-quote', request);
};

SocketGateway.prototype.getPartnerInfo = function(request) {
  return this.emit('get-partner-info', request);
};

SocketGateway.prototype.setPartnerInfo = function(request) {
  return this.emit('set-partner-info', request);
};

module.exports.io = io;