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
  this.networksById = {};
  Gateway.call(this, 'networks', 'networks');
  users
    .getAll()
    .then(function(allUsers){
      for(var user in allUsers) {
        if(allUsers.hasOwnProperty(user)) {
          if(user.role === 'network' && user.endpointType === 'restful') {
            var gateway = new RestfulGateway(user.clientId, user.callbackUrl, user.token);
            this.networksById[user.clientId] = gateway;
          }
        }
      }
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

NetworksGateway.prototype.updateRestfulGateway = function(user) {
  if(this.hasNetwork(user.clientId)) {
    this.networksById[user.clientId].callbackUrl = user.callbackUrl;
  } else {
    var gateway = new RestfulGateway(user.clientId, user.callbackUrl, user.token);
    this.networksById[user.clientId] = gateway;
  }
};

NetworksGateway.prototype.getNetwork = function(id) {
  if(!this.networksById.hasOwnProperty(id)) {
    throw new Error(id + ' not found');
  }
  return this.networksById[id];
};

NetworksGateway.prototype.hasNetwork = function(id) {
  return this.networksById.hasOwnProperty(id);
};

NetworksGateway.prototype.dispatchTrip = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).dispatchTrip(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.getTrip = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getTrip(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.getTripStatus = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getTripStatus(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.updateTripStatus = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).updateTripStatus(request); 
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.getQuote = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getQuote(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.getNetworkInfo = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getNetworkInfo(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.setNetworkInfo = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).setNetworkInfo(request);  
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.requestPayment = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).requestPayment(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.acceptPayment = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).acceptPayment(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.getDriversNearby = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getDriversNearby(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.getTrip = function(id, request) {
  if(this.hasNetwork(id)) {
    return this.getNetwork(id).getTrip(request);
  }
  throw new InvalidRequestError(resultCodes.rejected, id + ' doesn\'t exist');
};

NetworksGateway.prototype.broadcastQuote = function(request, networks) {
  var getQuotePromises = [];
  for(var i = 0; i < networks.length; i++) {
    var network = networks[i];
    if(this.networksById.hasOwnProperty(network.clientId)) {
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