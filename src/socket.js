Promise = require('bluebird');
var trips = require('./controller/trips');
var quotes = require('./controller/quotes');
var users = require('./controller/users');
var Gateway = require('./gateway').Gateway;

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
        if (user) {
          activeSocketsByClientId[user.id] = socket;
          activeClientIdsBySocket[socket] = user.id;
          next();
        } else {
          console.log("Invalid access token " + query.token);
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
    trips.dispatchTrip(req, cb);
  });
  socket.on('get-trip', function(req, cb){
    trips.getTrip(req, cb);
  });
  socket.on('get-trip-status', function(req, cb){
    trips.getTripStatus(req, cb);
  });
  socket.on('update-trip-status', function(req, cb){
    trips.updateTripStatus(req, cb);
  });
  
  //Quotes
  socket.on('quote-trip', function(req, cb){
    quotes.createQuote(req, cb);
  });
  socket.on('get-quote', function(req, cb){
    quotes.getQuote(req, cb);
  });
  socket.on('update-quote', function(req, cb){
    quotes.updateQuote(req, cb);
  });
  
  //Users
  socket.on('get-partner-info', function(req ,cb){
    users.getPartnerInfo(req, cb);
  });
  socket.on('set-partner-info', function(req, cb){
    users.setPartnerInfo(req, cb);
  });
  
  socket.on('disconnect', function(){
    var id = activeClientIdsBySocket[socket];
    delete activeSocketsByClientId[id];
    delete activeClientIdsBySocket[socket];
    console.log('Client disconnected', id);
  });
});

function appendClientId(socket, request) {
  request.clientId = activeClientIdsBySocket[socket];
  return request;
}

function SocketError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, SocketError);
}
SocketError.prototype = Object.create(Error.prototype);
SocketError.prototype.constructor = SocketError;

function emit(action, id, data) {
  return new Promise(function(resolve, reject){
    var socket = activeSocketsByClientId[id];
    if (socket) {
      socket.emit(action, data, function(res){
        console.log(action, res);
        resolve(res);
      });
    } else {
      console.log('Client ' + id + ' not connected');
      reject(new SocketError(null, 'Client ' + id + ' not connected'));
    }
  });
}

function broadcastQuoteToAllPartnersThatServe(request) {
  return users
    .getPartnersThatServeLocation(request.pickupLocation)
    .then(function(partners){
      for(var i = 0; i < partners.length; i++) {
        if(partners[i].id !== request.clientId) {
          emit('quote-trip', partners[i].id, request);
        }
      }
    });
}

function Socket() {
  this.io = io;
  this.SocketError = SocketError;
  Gateway.call(this, 'socket', 'socket');
}
Socket.prototype.dispatchTrip = function(id, request) {
  return emit('dispatch-trip', id, request);
};
Socket.prototype.getTrip = function(id, request) {
  return emit('get-trip', id, request);
};
Socket.prototype.getTripStatus = function(id, request) {
  return emit('get-trip-status', id, request);
};
Socket.prototype.updateTripStatus = function(id, request) {
  return emit('update-trip-status', id, request);
};
Socket.prototype.quoteTrip = function(id, request) {
  return emit('quote-trip', id, request);
};
Socket.prototype.getQuote = function(id, request) {
  return emit('get-quote', id, request);
};
Socket.prototype.updateQuote = function(id, request) {
  return emit('update-quote', id, request);
};
Socket.prototype.getPartnerInfo = function(id, request) {
  return emit('get-partner-info', id, request);
};
Socket.prototype.setPartnerInfo = function(id, request) {
  return emit('set-partner-info', id, request);
};
Socket.prototype.broadcastQuoteToAllPartnersThatServe = broadcastQuoteToAllPartnersThatServe;

module.exports = new Socket();