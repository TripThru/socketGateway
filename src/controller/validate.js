var tv4 = require('tv4');
var schemas = require('../schemas/api');
var moment = require('moment');
tv4.addFormat('date-time', function(data, schema) {
  if( typeof(data) !== 'string' || 
      !moment(data, moment.ISO_8601, true).isValid() ) {
    return 'date-time must be of form YYYY-MM-DDTHH:mm:ss';
  }
  return null;
});

function validate(data, schema) {
  return tv4.validateResult(data, schema);
}

// Public

module.exports = {
    
    dispatchTripRequest: function(request) {
      return validate(request, schemas.dispatchTripRequest);
    },
    quoteRequest: function(request) {
      return validate(request, schemas.quoteRequest);
    }
}

