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

function emit(action, clientId, data, cb) {
  var socket = activeSocketsByClientId[clientId];
  if (socket)
    socket.emit(action, data, cb);
  else
    throw new Error('Client not connected');
}

var self = module.exports = {
    io: io,
    dispatchTrip: function(clientId, request, cb) {
      emit('dispatch-trip', clientId, request, cb);
    },
    getTrip: function(clientId, request, cb) {
      emit('get-trip', clientId, request, cb);
    },
    getTripStatus: function(clientId, request, cb) {
      emit('get-trip-status', clientId, request, cb);
    },
    updateTripStatus: function(clientId, request, cb) {
      emit('update-trip-status', clientId, request, cb);
    },
    createQuote: function(clientId, request, cb) {
      emit('create-quote', clientId, request, cb);
    },
    getQuote: function(clientId, request, cb) {
      emit('get-quote', clientId, request, cb);
    },
    updateQuote: function(clientId, request, cb) {
      emit('update-quote', clientId, request, cb);
    }
}