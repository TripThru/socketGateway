Promise = require('bluebird');
var trips = Promise.promisifyAll(require('../model/trips'));
var codes = require('../codes');
var validate = require('./validate');

function successResponse() {
  return {
    result: codes.resultCodes.ok
  }
}
function failResponse() {
  return {
    result: codes.resultCodes.unknownError
  }
}
function invalidRequestResponse(error) {
  return {
    result: codes.resultCodes.invalidParameters,
    error: error
  }
}
function getTripResponse(trip) {
  var response = successResponse();
  response.trip = trip;
  return response;
}

//Public

var self = module.exports = {
    
  dispatchTrip: function(request, cb) {
    var validation = validate.dispatchTripRequest(request);
    if( validation.valid ) {
      var trip = request; //makeTripFromDispatchRequest(request);
      trips.add(trip).then(function(res) {
        cb(successResponse());
      }).error(function(err){
        cb(errorResponse());
      });
    } else {
      cb(invalidRequestResponse(validation.error.message));
    }
  },
  getTrip: function(request, cb) {
    return trips.getById(request).then(function(res) {
      cb(getTripResponse(res));
    }).error(function(err){
      cb(errorResponse());
    });
  },
  getTripStatus: function(trip, cb) {
    
  },
  updateTripStatus: function(trip, cb) {
    
  }
}