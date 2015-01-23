var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var trips = require('../model/trips');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var workers = require('../workers/trips');
var activeTripsTracker = require('../active_trips_tracker');
var logger = require('../logger');

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
  log.log('Dispatch ' + request.id + ' from ' + request.clientId, request);
  var validation = validate.dispatchTripRequest(request);
  if(!validation.valid) {
    var response = TripThruApiFactory.createResponseFromTrip(null, null,
        resultCodes.invalidParameters, validation.error.message);
    log.log('Response', response);
    return Promise.resolve(response);
  } else {
    var trip = TripThruApiFactory.createTripFromRequest(request, 'dispatch');
    return trips
      .getById(trip.id)
      .then(function(res){
        if(!res) {
          activeTripsTracker.addTrip(trip);
          return trips.add(trip);
        } else if(res.status === 'rejected' || res.status === 'cancelled') {
          // If trip was rejected or cancelled partner may try to dispatch again with same id
          if(activeTripsTracker.getTrip(trip)) { // Trip may have not been deactivated yet
            activeTripsTracker.updateTrip(trip);
          } else {
            activeTripsTracker.addTrip(trip);
          }
          return trips.update(trip);
        }
        throw new RequestError(resultCodes.rejected, 'trip already exists');
      })
      .then(function(res){
        if(!tripIsLocal(trip)) {
          log.log('Trip is foreign so created dispatch job');
          workers.newDispatchJob(trip.id);
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
  log.log('Get trip ' + request.id, request);
  return trips
    .getById(request.id)
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
  //log.log('Get trip status ' + request.id, request);
  var trip;
  return trips
    .getById(request.id)
    .bind(this)
    .then(function(t){
      trip = t;
      if(!trip || !activeTripsTracker.getTrip(trip)) {
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
  log.log('Update trip status (' + request.status + ') ' + request.id, request);
  var self = this;
  return trips
    .getById(request.id)
    .bind({})
    .then(function(t){
      if(t && activeTripsTracker.getTrip(t)) {
        log.setOrigin(
            t.originatingPartner.id === request.clientId ? 'origin' : 'servicing');
        this.oldStatus = t.status;
        this.trip = TripThruApiFactory.createTripFromRequest(request, 
            'update-trip-status', {trip: t});
        this.newStatus = this.trip.status;
        activeTripsTracker.updateTrip(this.trip);
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
  log.log('Get trip stats ' + trip.id, request);
  this
    .socket
    .getTripStatus(trip.servicingPartner.id, request)
    .then(function(response){
      trip = TripThruApiFactory.createTripFromResponse(response, 
          'get-trip-status', {trip: trip});
      activeTripsTracker.updateTrip(trip);
      trips.update(trip);
      log.log('Response', response);
    })
    .error(function(err){
      log.log('Response', err);
    });
};

module.exports = new TripsController();