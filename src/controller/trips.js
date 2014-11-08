var moment = require('moment');
var trips = require('../model/trips');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var convert = require('./convert');
var workers = require('../workers/trips');
var socket = require('../socket');
SocketError = socket.SocketError;

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

function UnsuccessfulRequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, UnsuccessfulRequestError);
}
UnsuccessfulRequestError.prototype = Object.create(Error.prototype);
UnsuccessfulRequestError.prototype.constructor = UnsuccessfulRequestError;

//Public

var self = module.exports = {
    
  dispatchTrip: function(request, cb) {
    var validation = validate.dispatchTripRequest(request);
    if( !validation.valid ) {
      cb(failResponse(resultCodes.invalidParameters, validation.error.message));
    } else {
      var trip = convert.toTripFromDispatchRequest(request);
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
      .getById(request.id)
      .then(function(trip){
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
  getTripStatus: function(request, cb) {
    var storedTrip;
    trips
    .getById(request.id)
    .then(function(trip){
      if( !trip )
        throw new RequestError(resultCodes.rejected, 'trip not found');
      else if( !trip.servicingPartner )
        throw new UnsuccessfulRequestError(resultCodes.rejected, 
            'no servicing partner defined');
      else { 
        storedTrip = trip;
        return socket.getTripStatus(trip.servicingPartner.id, request);
      }
    })
    .then(function(response){
      if( response.resultCode == resultCodes.ok )
        cb(response);
      else
        throw(new UnsuccessfulRequestError('Unsuccessful result code ' +
            response.resultCode));
    })
    .catch(SocketError, UnsuccessfulRequestError, function(err){
      // If call to client fails, fall back to last known status
      var response = successResponse();
      response.id = storedTrip.id;
      response.status = storedTrip.status;
      response.eta = moment(storedTrip.eta).utc().format();
      response.driver = storedTrip.driver;
      cb(response);
    })
    .catch(RequestError, function(err){
      cb(failResponse(err.resultCode, err.error))
    })
    .error(function(err){
      cb(failResponse(resultCodes.unknownError));
    });
  },
  updateTripStatus: function(request, cb) {
    trips
    .getById(request.id)
    .then(function(trip){
      var t = convert.toTripFromUpdateTripStatusRequest(request, trip);
      if( trip )
        return trips.update(t);
      else
        throw new RequestError(resultCodes.rejected, 'trip not found');
    })
    .then(function(){
      workers.newUpdateTripStatusJob(request);
      cb(successResponse());
    })
    .catch(RequestError, function(err){
      cb(failResponse(err.resultCode, err.error))
    })
    .error(function(err){
      cb(failResponse(resultCodes.unknownError));
    });
  }
}