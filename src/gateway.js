var Interface = require('./interface').Interface;
var logger = require('./logger');

var IGateway = new Interface('Gateway', ['getNetworkInfo',
                                         'setNetworkInfo',
                                         'dispatchTrip',
                                         'getTripStatus',
                                         'updateTripStatus',
                                         'getQuote',
                                         'requestPayment',
                                         'acceptPayment',
                                         'getDriversNearby',
                                         'getTrip'
                                         ]);

function Gateway(id, name) {
	this.id = id;
	this.name = name;
}

Gateway.prototype.getNetworkInfo = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.setNetworkInfo = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.dispatchTrip = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.getTripStatus = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.updateTripStatus = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.getQuote = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.requestPayment = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.acceptPayment = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.getDriversNearby = function() {
  throw new Error('Not implemented');
};

Gateway.prototype.getTrip = function() {
  throw new Error('Not implemented');
};

module.exports.Gateway = Gateway;
module.exports.IGateway = IGateway;