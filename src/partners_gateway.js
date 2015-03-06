var Promise = require('bluebird');
var Gateway = require('./gateway').Gateway;
var IGateway = require('./gateway').IGateway;
var Interface = require('./interface').Interface;
var RestfulGateway = require('./restful_gateway');
var users = require('./controller/users');

function PartnersGateway() {
  this.partnersById = {};
  Gateway.call(this, 'partners', 'partners');
  users
    .getAll()
    .then(function(allUsers){
      allUsers.forEach(function(user){
        if(user.role === 'partner' && user.endpointType === 'restful') {
          var gateway = new RestfulGateway(user.clientId, user.callbackUrl, user.callbackUrlToken);
          this.partnersById[user.clientId] = gateway;
        }
      }.bind(this));
    }.bind(this));
}

PartnersGateway.prototype.subscribePartner = function(gateway) {
  Interface.ensureImplements(gateway, IGateway);
  if(this.partnersById.hasOwnProperty(gateway.id)) {
    throw new Error(gateway.id + ' already exists');
  }
  this.partnersById[gateway.id] = gateway;
};

PartnersGateway.prototype.unsubscribePartner = function(id) {
  delete this.partnersById[id];
};

PartnersGateway.prototype.getPartner = function(id) {
  if(!this.partnersById.hasOwnProperty(id)) {
    throw new Error(id + ' not found');
  }
  return this.partnersById[id];
};

PartnersGateway.prototype.dispatchTrip = function(id, request) {
  return this.getPartner(id).dispatchTrip(request);
};

PartnersGateway.prototype.getTrip = function(id, request) {
  return this.getPartner(id).getTrip(request);
};

PartnersGateway.prototype.getTripStatus = function(id, request) {
  return this.getPartner(id).getTripStatus(request);
};

PartnersGateway.prototype.updateTripStatus = function(id, request) {
  return this.getPartner(id).updateTripStatus(request); 
};

PartnersGateway.prototype.quoteTrip = function(id, request) {
  return this.getPartner(id).quoteTrip(request);  
};

PartnersGateway.prototype.getQuote = function(id, request) {
  return this.getPartner(id).getQuote(request);
};

PartnersGateway.prototype.updateQuote = function(id, request) {
  return this.getPartner(id).updateQuote(request);  
};

PartnersGateway.prototype.getPartnerInfo = function(id, request) {
  return this.getPartner(id).getPartnerInfo(request);
};

PartnersGateway.prototype.setPartnerInfo = function(id, request) {
  return this.getPartner(id).setPartnerInfo(request);  
};

PartnersGateway.prototype.requestPayment = function(id, request) {
  return this.getPartner(id).requestPayment(request);
};

PartnersGateway.prototype.acceptPayment = function(id, request) {
  return this.getPartner(id).acceptPayment(request);
};

PartnersGateway.prototype.broadcastQuote = function(request, partners) {
  return new Promise(function(resolve, reject){ 
    for(var i = 0; i < partners.length; i++) {
      var id = partners[i].clientId;
      if(id !== request.clientId && this.partnersById.hasOwnProperty(id)) {
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
PartnersGateway.prototype.ConnectionError = ConnectionError;

module.exports = new PartnersGateway();