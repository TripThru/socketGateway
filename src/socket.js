var trips = require('./controller/trips');
var quotes = require('./controller/quotes');

var io = require('socket.io')({
  transports:['websocket']
});

//no need for server to serve client files
io.serveClient(false);

//authentication middleware
io.use(function(socket, next){
  var query = socket.handshake.query;

  if (!query || !query.token)
    console.log("Invalid connection attempt");
  else if (query.token != 'token123')
    console.log("Invalid access token");
  else
    next();
});

io.sockets.on('connection', function (socket){

  //TODO: log connect
  
  // Trips
  socket.on('dispatch-trip', trips.dispatchTrip);
  socket.on('get-trip', trips.getTrip);
  socket.on('get-trip-status', trips.getTripStatus);
  socket.on('update-trip-status', trips.updateTripStatus);
  
  //Quotes
  socket.on('create-quote', quotes.createQuote);
  socket.on('update-quote', quotes.updateQuote);
  socket.on('get-quote', quotes.getQuote);
  
  socket.on('disconnect', function(){
    //TODO: log disconnect
  });
});

module.exports.io = io;