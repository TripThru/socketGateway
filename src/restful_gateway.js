var Promise = require('bluebird');
var Gateway = require('./gateway').Gateway;
var IGateway = require('./gateway').IGateway;
var Interface = require('./interface').Interface;
var request = require('request');
var codes = require('./codes');
var resultCodes = codes.resultCodes;
var UnsuccessfulRequestError = require('./errors').UnsuccessfulRequestError;

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function RestfulGateway(id, rootUrl, token) {
  this.id = id;
  if(!endsWith(rootUrl, '/')) {
    rootUrl += '/';
  }
  this.rootUrl = rootUrl;
  this.token = token;
  Gateway.call(this, id, id);
}

RestfulGateway.prototype.setRootUrl = function(rootUrl) {
  if(!endsWith(rootUrl, '/')) {
    rootUrl += '/';
  }
  this.rootUrl = rootUrl;
};

RestfulGateway.prototype.get = function(path, id, req) {
  return new Promise(function(resolve, reject){
    if(id) {
      path += '/' + id;
    }
    var client_id = this.id;
    var url = this.rootUrl + path + '?token=' + this.token;
    request({
      url: url,
      method: 'GET',
      timeout: 60000,
      followRedirect: true,
      maxRedirects: 10,
      body: req,
      json: true
    }, function(error, response, body){
      if(error) {
        reject(new UnsuccessfulRequestError(resultCodes.unknownError, error));
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
    var client_id = this.id;
    var url = this.rootUrl + path + '?token=' + this.token;
    request({
      url: url,
      method: 'POST',
      timeout: 60000,
      followRedirect: true,
      maxRedirects: 10,
      body: req,
      json: true
    }, function(error, response, body){
      if(error) {
        reject(new UnsuccessfulRequestError(resultCodes.unknownError, error));
      } else {
        resolve(body);
      }
    });
  }.bind(this));
};

RestfulGateway.prototype.put = function(path, id, req) {
  return new Promise(function(resolve, reject){
    if(id) {
      path += '/' + id;
    }
    var client_id = this.id;
    var url = this.rootUrl + path + '?token=' + this.token;
    request({
      url: url,
      method: 'PUT',
      timeout: 60000,
      followRedirect: true,
      maxRedirects: 10,
      body: req,
      json: true
    }, function(error, response, body){
      if(error) {
        reject(new UnsuccessfulRequestError(resultCodes.unknownError, error));
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
