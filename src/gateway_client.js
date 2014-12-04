var io = require('socket.io-client');
var querystring = require('querystring');

function GatewayClient(url, token) {
  
  var self = this;
  this.socket = io.connect(url, {
    query: querystring.stringify({token:token}),
    transports: ['websocket']
  });
  
  this.socket.on('connect', function (){
    console.log('connected to ' + url);
  }); 
  this.socket.on('error', function (data){
    console.log('error on ' + url, data);
  });
  this.socket.on('disconnect', function (){
    console.log('disconnect from ' + url);
  });
  this.socket.on('hello', function(msg, cb){
    console.log(msg);
    cb('hello back');
  });
  
  this.dispatchTrip = function(trip, cb) {
    self.socket.emit('dispatch-trip', trip, cb);
  }

  this.getTrip = function(id, cb) {
    self.socket.emit('get-trip', id, cb);
  }
  
}

module.exports = GatewayClient;