var tv4 = require('tv4');
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
  var validation = tv4.validateResult(data, schema);
  if(!validation.valid) {
    validation.error.message += ' for ' + validation.error.dataPath;
  }
  return validation;
}

var dispatchTripRequest = function(request) {
  return validate(request, schemas.dispatchTripRequest);
};

var quoteRequest = function(request) {
  return validate(request, schemas.quoteTripRequest);
};

module.exports = {
  dispatchTripRequest: dispatchTripRequest,
  quoteRequest: quoteRequest
};

