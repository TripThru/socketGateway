var Gateway = require('./gateway').Gateway;
var Promise = require('bluebird');

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

SocketGateway.prototype.requestPayment = function(request) {
  return this.emit('request-payment', request);
};

SocketGateway.prototype.acceptPayment = function(request) {
  return this.emit('accept-payment', request);
};

module.exports = SocketGateway;