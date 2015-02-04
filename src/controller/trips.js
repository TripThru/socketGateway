var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var trips = require('../active_trips');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var workers = require('../workers/trips');
var quotesController = require('./quotes');
var logger = require('../logger');
var users = require('./users');

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

function tripIsLocal(trip, request) {
  return trip.servicingPartner && 
    trip.originatingPartner.id === trip.servicingPartner.id;
}

function isActiveStatus(status) {
  return status === 'dispatched' || status === 'enroute' || 
    status === 'pickedup';
}

function shouldForwardUpdate(trip, currentStatus, newStatus) {
  var shouldForward = trip.servicingPartner && 
    trip.originatingPartner.id !== trip.servicingPartner.id;
  if(!isActiveStatus(currentStatus) && !isActiveStatus(newStatus)) {
    shouldForward = false;
  }
  return shouldForward;
}

function TripsController() {
  this.socket = null;
}

TripsController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.socket = gatewayClient;
};

TripsController.prototype.dispatchTrip =  function(request) {
  var log = logger.getSublog(request.id, 'origin', 'tripthru', 'dispatch');
  var validation = validate.dispatchTripRequest(request);
  if(!validation.valid) {
    log.log('Invalid dispatch received from ' + request.clientId, request);
    var response = TripThruApiFactory.createResponseFromTrip(null, null,
        resultCodes.invalidParameters, validation.error.message);
    log.log('Response', response);
    return Promise.resolve(response);
  } else {
    var trip = TripThruApiFactory.createTripFromRequest(request, 'dispatch');
    return users
      .getById(request.clientId)
      .then(function(user){
        var name = user ? user.fullname : 'unknown';
        log.log('Dispatch received from ' + name, request);
        return trips.getById(trip.id);
      })
      .then(function(res){
        if(!res) {
          return trips.add(trip);
        } else if(res.status === 'rejected' || res.status === 'cancelled') {
          return trips.update(trip);
        }
        throw new RequestError(resultCodes.rejected, 'trip already exists');
      })
      .then(function(res){
        if(!tripIsLocal(trip)) {
          if(trip.autoDispatch) {
            log.log('Trip is foreign and no servicing specified so created quote job');
            quotesController.createAutoDispatchQuote(trip);
          } else {
            log.log('Trip is foreign so created dispatch job');
            workers.newDispatchJob(trip.id);
          }
        }
        var response = TripThruApiFactory.createResponseFromTrip(trip, 'dispatch');
        log.log('Response', response.result);
        return response;
      })
      .catch(RequestError, function(err){
        var response = TripThruApiFactory.createResponseFromTrip(null, null, 
            err.resultCode, err.error);
        log.log('Response', response.result);
        return response;
      })
      .error(function(err){
        var response = TripThruApiFactory.createResponseFromTrip(null, null, 
            resultCodes.unknownError, 'unknown error ocurred');
        log.log('Response', response.result);
        return response;
      });
  }
};

TripsController.prototype.getTrip = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'get-trip');
  return users
    .getById(request.clientId)
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Get trip received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(trip){
      if(trip) {
        var response = TripThruApiFactory.createResponseFromTrip(trip, 'get-trip');
        log.setOrigin(
            trip.originatingPartner.id === request.clientId ? 'origin' : 'servicing');
        log.log('Response', response);
        return response;
      } else {
        throw new RequestError(resultCodes.rejected, 'trip not found');
      }
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

TripsController.prototype.getTripStatus = function(request) {
  //var log = logger.getSublog(request.id);
  var trip;
  return users
    .getById(request.clientId)
    .bind(this)
    .then(function(user){
      //var name = user ? user.fullname : 'unknown';
      //log.log('Get trip status received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(t){
      trip = t;
      if(!trip) {
        throw new RequestError(resultCodes.rejected, 'trip ' + request.id + ' not found');
      } else if(!trip.servicingPartner) {
        return {result: resultCodes.notFound};
      } else { 
        return this.socket.getTripStatus(trip.servicingPartner.id, request);
      }
    })
    .then(function(response){
      if(response.result === resultCodes.ok) {
        var res = 
          TripThruApiFactory.createGetTripStatusResponseFromPartnerGetTripStatusResponse(response, trip);
        //log.log('Response', res);
        return res;
      } else {
        throw(new UnsuccessfulRequestError('Unsuccessful result code ' +
            response.resultCode));
      }
    })
    .catch(this.socket.SocketError, UnsuccessfulRequestError, function(err){
      // If request to client fails, fall back to last known status
      var response = 
        TripThruApiFactory.createResponseFromTrip(trip, 'get-trip-status');
      //log.log('Response', response);
      return response;
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null, 
          err.resultCode, err.error);
      //log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      //log.log('Response', response);
      return response;
    });
};

TripsController.prototype.updateTripStatus = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'update-trip-status', 
      request.status);
  var self = this;
  return users
    .getById(request.clientId)
    .bind({})
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Update trip status (' + request.status + ') received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(t){
      if(t) {
        log.setOrigin(
            t.originatingPartner.id === request.clientId ? 'origin' : 'servicing');
        this.oldStatus = t.status;
        this.trip = TripThruApiFactory.createTripFromRequest(request, 
            'update-trip-status', {trip: t});
        this.newStatus = this.trip.status;
        return trips.update(this.trip);
      }
      throw new RequestError(resultCodes.rejected, 'trip not found');
    })
    .then(function(){
      if(shouldForwardUpdate(this.trip, this.oldStatus, this.newStatus)) {
        var sendTo = request.clientId === this.trip.originatingPartner.id ?
            this.trip.servicingPartner.id : this.trip.originatingPartner.id;
        log.log('Trip has foreign dependency so creating update trip status job');
        workers.newUpdateTripStatusJob(request, sendTo);
      }
      if(this.trip.status === 'complete') {
        self.getTripStats(this.trip);
      }
      var response = 
        TripThruApiFactory.createResponseFromTrip(this.trip, 'update-trip-status');
      log.log('Response', response);
      return response;
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

TripsController.prototype.getTripStats = function(trip) {
  var log = logger.getSublog(trip.id, 'tripthru', 'servicing', 'get-trip-status');
  var request = TripThruApiFactory.createRequestFromTrip(trip, 'get-trip-status');
  log.log('Get trip status sent to ' + trip.servicingPartner.name, request);
  this
    .socket
    .getTripStatus(trip.servicingPartner.id, request)
    .then(function(response){
      trip = TripThruApiFactory.createTripFromResponse(response, 
          'get-trip-status', {trip: trip});
      trips.update(trip);
      log.log('Response', response);
    })
    .error(function(err){
      log.log('Response', err);
    });
};

module.exports = new TripsController();