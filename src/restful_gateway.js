var Promise = require('bluebird');
var Gateway = require('./gateway').Gateway;
var IGateway = require('./gateway').IGateway;
var Interface = require('./interface').Interface;
var request = require('request');

function RestfulGateway(id, rootUrl, token) {
  this.id = id;
  this.rootUrl = rootUrl;
  this.token = token;
  Gateway.call(this, id, id);
}

RestfulGateway.prototype.get = function(path, id, req) {
  return new Promise(function(resolve, reject){
    if(id) {
      path += '/' + id;
    }
    request({
      uri: this.rootUrl + '/' + path + '?token=' + this.token,
      method: 'GET',
      timeout: 10000,
      followRedirect: true,
      maxRedirects: 10
    }, function(error, response, body){
      if(error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  }.bind(this));
};

RestfulGateway.prototype.post = function(path, id, req) {
  return new Promise(function(resolve, reject){
    if(id) {
      path += '/' + id;
    }
    request({
      uri: this.rootUrl + '/' + path + '?token=' + this.token,
      method: 'POST',
      timeout: 10000,
      followRedirect: true,
      maxRedirects: 10
    }, function(error, response, body){
      if(error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  }.bind(this));
};

RestfulGateway.prototype.put = function(path, id, request) {
  return new Promise(function(resolve, reject){
    path += '/' + id;
    request({
      uri: this.rootUrl + '/' + path + '?token=' + this.token,
      method: 'PUT',
      timeout: 10000,
      followRedirect: true,
      maxRedirects: 10
    }, function(error, response, body){
      if(error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  }.bind(this));
};

RestfulGateway.prototype.dispatchTrip = function(request) {
  return this.post('trip', request.id, request);
};

RestfulGateway.prototype.getTrip = function(request) {
  return this.get('trip', request.id, request);
};

RestfulGateway.prototype.getTripStatus = function(request) {
  return this.get('tripstatus', request.id, request);
};

RestfulGateway.prototype.updateTripStatus = function(request) {
  return this.put('tripstatus', request.id, request);
};

RestfulGateway.prototype.quoteTrip = function(request) {
  return this.post('quote', request.id, request);
};

RestfulGateway.prototype.getQuote = function(request) {
  return this.get('quote', request.id, request);
};

RestfulGateway.prototype.updateQuote = function(request) {
  return this.put('quote', request.id, request);
};

RestfulGateway.prototype.getNetworkInfo = function(request) {
  return this.get('network', request.id, request);
};

RestfulGateway.prototype.setNetworkInfo = function(request) {
  return this.post('network', request.id, request);
};

RestfulGateway.prototype.requestPayment = function(request) {
  return this.post('payment', request.id, request);
};

RestfulGateway.prototype.acceptPayment = function(request) {
  return this.put('payment', request.id, request);
};

RestfulGateway.prototype.getDriversNearby = function(request) {
  return this.get('drivers', null, request);
};

RestfulGateway.prototype.getTrip = function(request) {
  return this.get('trip', request.id, request);
};

module.exports = RestfulGateway;
