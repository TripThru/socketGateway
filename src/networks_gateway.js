var Promise = require('bluebird');
var Gateway = require('./gateway').Gateway;
var IGateway = require('./gateway').IGateway;
var Interface = require('./interface').Interface;
var RestfulGateway = require('./restful_gateway');
var users = require('./controller/users');

function NetworksGateway() {
  this.networksById = {};
  Gateway.call(this, 'networks', 'networks');
  users
    .getAll()
    .then(function(allUsers){
      allUsers.forEach(function(user){
        if(user.role === 'network' && user.endpointType === 'restful') {
          var gateway = new RestfulGateway(user.clientId, user.callbackUrl, user.callbackUrlToken);
          this.networksById[user.clientId] = gateway;
        }
      }.bind(this));
    }.bind(this));
}

NetworksGateway.prototype.subscribeNetwork = function(gateway) {
  Interface.ensureImplements(gateway, IGateway);
  if(this.networksById.hasOwnProperty(gateway.id)) {
    throw new Error(gateway.id + ' already exists');
  }
  this.networksById[gateway.id] = gateway;
};

NetworksGateway.prototype.unsubscribeNetwork = function(id) {
  delete this.networksById[id];
};

NetworksGateway.prototype.getNetwork = function(id) {
  if(!this.networksById.hasOwnProperty(id)) {
    throw new Error(id + ' not found');
  }
  return this.networksById[id];
};

NetworksGateway.prototype.dispatchTrip = function(id, request) {
  return this.getNetwork(id).dispatchTrip(request);
};

NetworksGateway.prototype.getTrip = function(id, request) {
  return this.getNetwork(id).getTrip(request);
};

NetworksGateway.prototype.getTripStatus = function(id, request) {
  return this.getNetwork(id).getTripStatus(request);
};

NetworksGateway.prototype.updateTripStatus = function(id, request) {
  return this.getNetwork(id).updateTripStatus(request); 
};

NetworksGateway.prototype.quoteTrip = function(id, request) {
  return this.getNetwork(id).quoteTrip(request);  
};

NetworksGateway.prototype.getQuote = function(id, request) {
  return this.getNetwork(id).getQuote(request);
};

NetworksGateway.prototype.updateQuote = function(id, request) {
  return this.getNetwork(id).updateQuote(request);  
};

NetworksGateway.prototype.getNetworkInfo = function(id, request) {
  return this.getNetwork(id).getNetworkInfo(request);
};

NetworksGateway.prototype.setNetworkInfo = function(id, request) {
  return this.getNetwork(id).setNetworkInfo(request);  
};

NetworksGateway.prototype.requestPayment = function(id, request) {
  return this.getNetwork(id).requestPayment(request);
};

NetworksGateway.prototype.acceptPayment = function(id, request) {
  return this.getNetwork(id).acceptPayment(request);
};

NetworksGateway.prototype.broadcastQuote = function(request, networks) {
  return new Promise(function(resolve, reject){ 
    for(var i = 0; i < networks.length; i++) {
      var id = networks[i].clientId;
      if(id !== request.clientId && this.networksById.hasOwnProperty(id)) {
        this.quoteTrip(id, request);
      }
    }
    resolve();
  }.bind(this));
};

function ConnectionError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, ConnectionError);
}
ConnectionError.prototype = Object.create(Error.prototype);
ConnectionError.prototype.constructor = ConnectionError;
NetworksGateway.prototype.ConnectionError = ConnectionError;

module.exports = new NetworksGateway();