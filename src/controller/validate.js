var tv4 = require('tv4');
var Promise = require('bluebird');
var schemas = require('../schemas/api');
var moment = require('moment');
tv4.addFormat('date-time', function(data, schema){
  if( typeof(data) !== 'string' || 
      !moment(data, moment.ISO_8601, true).isValid() ) {
    return 'date-time must be of form YYYY-MM-DDTHH:mm:ss';
  }
  return null;
});

function validate(data, schema) {
  return new Promise(function(resolve, reject){
    var validation = tv4.validateResult(data, schema);
    if(!validation.valid) {
      validation.error.message += ': ' + validation.error.dataPath;
    }
    resolve(validation);
  });
}

function Validator() {
  
}

Validator.prototype.setNetworkInfoRequest = function(request) {
  return validate(request, schemas.setNetworkInfo);
};

Validator.prototype.getNetworkInfoRequest = function(request) {
  return validate(request, schemas.getNetworkInfo);
};

Validator.prototype.dispatchTripRequest = function(request) {
  return validate(request, schemas.dispatch);
};

Validator.prototype.getTripStatusRequest = function(request) {
  return validate(request, schemas.getTripStatus);
};

Validator.prototype.updateTripStatusRequest = function(request) {
  return validate(request, schemas.updateTripStatus);
};

Validator.prototype.getQuoteRequest = function(request) {
  return validate(request, schemas.quote);
};

Validator.prototype.getDriversNearbyRequest = function(request) {
  return validate(request, schemas.getDriversNearby);
};

Validator.prototype.requestPaymentRequest = function(request) {
  return validate(request, schemas.requestPayment);
};

Validator.prototype.acceptPaymentRequest = function(request) {
  return validate(request, schemas.acceptPayment);
};

module.exports = new Validator();

