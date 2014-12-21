var Interface = require('./interface').Interface;
var logger = require('./logger');

var IGateway = new Interface('Gateway', ['getPartnerInfo',
                                         'dispatchTrip',
                                         'getTrip',
                                         'getTripStatus',
                                         'updateTripStatus',
                                         'quoteTrip',
                                         'updateQuote',
                                         'getQuote'
                                         ]);

function Gateway(id, name) {
	this.id = id;
	this.name = name;
}

Gateway.prototype.getPartnerInfo = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.dispatchTrip = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.getTrip = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.getTripStatus = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.updateTripStatus = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.quoteTrip = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.updateQuote = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.getQuote = function(request) {
  throw new Error('Not implemented');
};

Gateway.prototype.update = function() {
  throw new Error('Not implemented');
};

module.exports.Gateway = Gateway;
module.exports.IGateway = IGateway;