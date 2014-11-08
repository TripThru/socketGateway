Promise = require('bluebird');
var trips = Promise.promisifyAll(require('../model/trips'));
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var covert = require('./convert');
var workers = require('../workers/trips');

function successResponse() {
  return {
    result: codes.resultCodes.ok
  }
}
function failResponse(resultCode, error) {
  return {
    result: resultCode,
    error: error
  }
}

function RequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, RequestError);
}
RequestError.prototype = Object.create(Error.prototype);
RequestError.prototype.constructor = RequestError;

//Public

var self = module.exports = {
    
  dispatchTrip: function(request, cb) {
    var validation = validate.dispatchTripRequest(request);
    if( !validation.valid ) {
      cb(failResponse(resultCodes.invalidParameters, validation.error.message));
    } else {
      var trip = request;//convert.toTrip(request);
      trips
        .getById(trip.id)
        .then(function(res){
          if( !res ) // If trip doesn't exist
            return trips.add(trip);
          else
            throw new RequestError(resultCodes.rejected, 'trip already exists');
        })
        .then(function(res){
          workers.newDispatchJob(request);
          cb(successResponse());
        })
        .catch(RequestError, function(err){
          cb(failResponse(err.resultCode, err.error))
        })
        .error(function(err){
          cb(failResponse(resultCodes.unknownError));
        });
    }
  },
  getTrip: function(request, cb) {
    trips
      .getById(request).then(function(trip){
        if( trip ) {
          var response = successResponse();
          response.trip = trip;
          cb(response);
        } else {
          throw new RequestError(resultCodes.rejected, 'trip not found');
        }
      })
      .catch(RequestError, function(err){
        cb(failResponse(err.resultCode, err.error))
      })
      .error(function(err){
        cb(failResponse(resultCodes.unknownError));
      });
  },
  getTripStatus: function(trip) {
    
  },
  updateTripStatus: function(trip) {
    
  }
}