var Promise = require('bluebird');
var Gateway = require('./gateway').Gateway;
var IGateway = require('./gateway').IGateway;
var Interface = require('./interface').Interface;
var RestfulGateway = require('./restful_gateway');
var users = require('./controller/users');
var codes = require('./codes');
var resultCodes = codes.resultCodes;
var UnsuccessfulRequestError = require('./errors').UnsuccessfulRequestError;
var InvalidRequestError = require('./errors').InvalidRequestError;

function NetworksGateway() {
  this.restfulNetworksById = {};
  this.socketNetworksById = {};
  Gateway.call(this, 'networks', 'networks');
  users
    .getAll()
    .then(function(allUsers){
      for(var id in allUsers) {
        if(allUsers.hasOwnProperty(id)) {
          var user = allUsers[id];
          if(user.role === 'network' && user.callbackUrl) {
            this.updateRestfulGateway(user);
          }
        }
      }
    }.bind(this));
}

NetworksGateway.prototype.subscribeSocketGateway = function(gateway) {
  Interface.ensureImplements(gateway, IGateway);
  if(this.hasSocketNetwork(gateway.id)) {
    throw new Error(gateway.id + ' already exists');
  }
  this.socketNetworksById[gateway.id] = gateway;
};

NetworksGateway.prototype.unsubscribeSocketGateway = function(id) {
  delete this.socketNetworksById[id];
};

NetworksGateway.prototype.updateRestfulGateway = function(user) {
  if(this.hasRestfulNetwork(user.clientId)) {
    this.restfulNetworksById[user.clientId].setRootUrl(user.callbackUrl);
  } else {
    var gateway = new RestfulGateway(user.clientId, user.callbackUrl, user.token);
    this.restfulNetworksById[user.clientId] = gateway;
  }
};

NetworksGateway.prototype.getNetwork = function(id) {
  if(!this.hasNetwork(id)) {
    throw new Error(id + ' not found');
  }
  return this.socketNetworksById[id] || this.restfulNetworksById[id];
};

NetworksGateway.prototype.hasNetwork = function(id) {
  return this.socketNetworksById.hasOwnProperty(id) || 
         this.restfulNetworksById.hasOwnProperty(id);
};

NetworksGateway.prototype.hasSocketNetwork = function(id) {
  return this.socketNetworksById.hasOwnProperty(id);
};

NetworksGateway.prototype.hasRestfulNetwork = function(id) {
  return this.restfulNetworksById.hasOwnProperty(id);
};

NetworksGateway.prototype.dispatchTrip = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).dispatchTrip(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.getTrip = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getTrip(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.getTripStatus = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getTripStatus(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.updateTripStatus = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).updateTripStatus(request); 
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.getQuote = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getQuote(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.getNetworkInfo = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getNetworkInfo(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.setNetworkInfo = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).setNetworkInfo(request);  
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.requestPayment = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).requestPayment(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.acceptPayment = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).acceptPayment(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.getDriversNearby = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getDriversNearby(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.getTrip = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getTrip(request);
  }
  return Promise.reject(new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist'));
};

NetworksGateway.prototype.broadcastQuote = function(request, networks) {
  var getQuotePromises = [];
  for(var i = 0; i < networks.length; i++) {
    var network = networks[i];
    if(this.hasNetwork(network.clientId)) {
      getQuotePromises.push(this.getQuote(network.clientId, request));
    }
  }
  return Promise
    .settle(getQuotePromises)
    .then(function(results){
      var quotes = [];
      for(var i = 0; i < results.length; i++) {
        if(results[i].isFulfilled()) {
          var value = results[i].value();
          if(value.result_code === resultCodes.ok && value.quotes.length > 0) {
            quotes = quotes.concat(value.quotes);
          }
        }
      }
      return quotes;
    });
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