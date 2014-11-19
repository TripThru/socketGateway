Promise = require('bluebird');
var trips = require('./controller/trips');
var quotes = require('./controller/quotes');
var users = require('./model/users');

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
    users.getByToken(query.token).then(function(user){
      if (user) {
        activeSocketsByClientId[user.clientId] = socket;
        activeClientIdsBySocket[socket] = user.clientId;
        next();
      } else {
        console.log("Invalid access token");
      }
    });
  }
});

io.sockets.on('connection', function (socket){
  var token = socket.handshake.query.token;
  //TODO: log connect
  console.log('Client connected', token);
  
  // Trips
  socket.on('dispatch-trip', function(req, cb){
    trips.dispatchTrip(appendClientId(socket, req), cb);
  });
  socket.on('get-trip', function(req, cb){
    trips.getTrip(appendClientId(socket, req), cb);
  });
  socket.on('get-trip-status', function(req, cb){
    trips.getTripStatus(appendClientId(socket, req), cb);
  });
  socket.on('update-trip-status', function(req, cb){
    trips.updateTripStatus(appendClientId(socket, req), cb);
  });
  
  //Quotes
  socket.on('create-quote', function(req, cb){
    quotes.createQuote(appendClientId(socket, req), cb);
  });
  socket.on('get-quote', function(req, cb){
    quotes.getQuote(appendClientId(socket, req), cb);
  });
  socket.on('update-quote', function(req, cb){
    quotes.updateQuote(appendClientId(socket, req), cb);
  });
  
  socket.on('disconnect', function(){
    var id = activeClientIdsBySocket[socket];
    delete activeSocketsByClientId[id];
    delete activeClientIdsBySocket[socket];
    //TODO: log disconnect
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

function emit(action, clientId, data) {
  return new Promise(function(resolve, reject){
    var socket = activeSocketsByClientId[clientId];
    if (socket)
      socket.emit(action, data, function(res){
        resolve(res);
      });
    else
      reject(new SocketError(null, 'Client not connected'));
  });
};

var self = module.exports = {
    io: io,
    SocketError: SocketError,
    dispatchTrip: function(clientId, request) {
      return emit('dispatch-trip', clientId, request);
    },
    getTrip: function(clientId, request) {
      return emit('get-trip', clientId, request);
    },
    getTripStatus: function(clientId, request) {
      return emit('get-trip-status', clientId, request);
    },
    updateTripStatus: function(clientId, request) {
      return emit('update-trip-status', clientId, request);
    },
    createQuote: function(clientId, request) {
      return emit('create-quote', clientId, request);
    },
    getQuote: function(clientId, request) {
      return emit('get-quote', clientId, request);
    },
    updateQuote: function(clientId, request) {
      return emit('update-quote', clientId, request);
    }
}