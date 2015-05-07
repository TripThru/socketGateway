var Gateway = require('./gateway').Gateway;
var Promise = require('bluebird');
var codes = require('./codes');
var resultCodes = codes.resultCodes;
var UnsuccessfulRequestError = require('./errors').UnsuccessfulRequestError;

function SocketGateway(id, socket, io) {
  this.id = id;
  this.socket = socket;
  this.io = io;
  this.connected = true;
  Gateway.call(this, id, id);
}

SocketGateway.prototype.emit = function(action, data) {
  return new Promise(function(resolve, reject){
    var receivedResponse = false;
    this.socket.emit(action, data, function(res){
      if(this.connected) { 
        receivedResponse = true;
        resolve(res);
      }
    }.bind(this));
    setTimeout(function(){
      if(!receivedResponse && this.connected) {
        this.connected = false;
        this.io.disconnectClient(this.socket);
        console.log(this.id + ' TIMEOUT #### DISCONNECTED');
        reject(new UnsuccessfulRequestError(resultCodes.unknownError, 'Timeout'));
      }
    }.bind(this), 10000);
  }.bind(this));
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

SocketGateway.prototype.getQuote = function(request) {
  return this.emit('get-quote', request);
};

SocketGateway.prototype.getNetworkInfo = function(request) {
  return this.emit('get-network-info', request);
};

SocketGateway.prototype.setNetworkInfo = function(request) {
  return this.emit('set-network-info', request);
};

SocketGateway.prototype.requestPayment = function(request) {
  return this.emit('request-payment', request);
};

SocketGateway.prototype.acceptPayment = function(request) {
  return this.emit('accept-payment', request);
};

SocketGateway.prototype.getDriversNearby = function(request) {
  return this.emit('get-drivers-nearby', request);
};

SocketGateway.prototype.getTrip = function(request) {
  return this.emit('get-trip', request);
};

module.exports = SocketGateway;