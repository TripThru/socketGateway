var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var trips = require('../active_trips');
var tripPayments = require('./trip_payments');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var workers = require('../workers/trips');
var quotesController = require('./quotes');
var logger = require('../logger');
var users = require('./users');
var InvalidRequestError = require('../errors').InvalidRequestError;
var UnsuccessfulRequestError = require('../errors').UnsuccessfulRequestError;

function TripsController() {
  this.gateway = null;
}

TripsController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.gateway = gatewayClient;
};

//Todo: Handle quote ids
TripsController.prototype.dispatchTrip =  function(request) {
  var log = logger.getSublog(request.id, 'origin', 'tripthru', 'dispatch');
  var self = this;
  return validate
    .dispatchTripRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        this.trip = TripThruApiFactory.createTripFromRequest(request, 'dispatch');
        return users.getById(request.client_id);
      } else {
        log.log('Invalid dispatch received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.name : 'unknown';
      log.log('Dispatch received from ' + name, request);
      return trips.getById(this.trip.id);
    })
    .then(function(res){
      if(!res) {
        return trips.create(this.trip);
      }
      throw new InvalidRequestError(resultCodes.rejected, 'Trip already exists');
    })
    .then(function(res){
      if(!tripIsLocal(this.trip) && this.trip.autoDispatch) {
        log.log('Trip is foreign and no servicing specified so getting best quote');
        return quotesController.getBestQuote(this.trip);
      }
    })
    .then(function(bestQuote){
      if(this.trip.autoDispatch && bestQuote) {
        this.trip.servicingNetwork = bestQuote.network;
        this.bestQuote = bestQuote;
        if(bestQuote.product) {
          this.trip.servicingProduct = bestQuote.product;
          this.trip.imageUrl = bestQuote.product.image_url;
        }
        return users
          .hasEnoughBalance(request.client_id, bestQuote.fare.high_estimate, bestQuote.fare.currency_code)
          .bind(this)
          .then(function(enoughBalance){
            if(!enoughBalance) {
              throw new UnsuccessfulRequestError(resultCodes.rejected, 'Insufficient funds');
            }
          });
      }
    })
    .then(function(){
      this.dispatchLog = logger.getSublog(request.id, 'tripthru', 'servicing', 'dispatch');
      if(this.trip.servicingNetwork) {
        var dispatchReq = TripThruApiFactory.createRequestFromTrip(this.trip, 'dispatch');
        this.dispatchLog.log('Dispatching trip to ' + this.trip.servicingNetwork.name, dispatchReq);
        return self.gateway.dispatchTrip(dispatchReq.network_id, dispatchReq);
      } else {
        var response = TripThruApiFactory.createResponseFromTrip(null, null,
            resultCodes.rejected, 'No servicing network found');
        this.dispatchLog.log('Trip rejected');
        return response;
      }
    })
    .then(function(response){
      this.dispatchResponse = response;
      if(response.result_code === resultCodes.rejected) {
        this.trip.status = 'rejected';
      }
      //if(response.result_code === resultCodes.ok &&  this.bestQuote) {
      //  return tripPayments.expectPayment(request.client_id, this.trip.id, this.bestQuote.fare.high_estimate, this.bestQuote.fare.currency_code, this.dispatchLog);
      //}
    })
    .then(function(){
      return trips.update(this.trip);
    })
    .then(function(){
      log.log('Response', this.dispatchResponse);
      this.dispatchLog.log('Response', this.dispatchResponse);
      return this.dispatchResponse;
    })
    .catch(InvalidRequestError, UnsuccessfulRequestError, function(err){
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
  var self = this;
  return validate
    .getTripStatusRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getById(request.client_id);
      } else {
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      this.user = user;
      return trips.getById(request.id);
    })
    .then(function(t){
      this.trip = t;
      if(this.user.role !== 'admin' && (!this.trip || !tripBelongsToUser(this.trip, this.user))) {
        throw new InvalidRequestError(resultCodes.notFound, 'Trip not found');
      } else if(this.trip && !this.trip.servicingNetwork) {
        throw new UnsuccessfulRequestError(resultCodes.rejected, 'Trip has no servicing network');
      } else {
        delete request['client_id'];
        return self.gateway.getTripStatus(this.trip.servicingNetwork.id, request);
      }
    })
    .then(function(response){
      if(response.result_code === resultCodes.ok) {
        var res =
          TripThruApiFactory.createGetTripStatusResponseFromNetworkGetTripStatusResponse(response, this.trip);
        return res;
      } else {
        throw(new UnsuccessfulRequestError(response.result_code, 'Unsuccessful request'));
      }
    })
    .catch(this.gateway.ConnectionError, UnsuccessfulRequestError, function(err){
      var response =
        TripThruApiFactory.createResponseFromTrip(this.trip, 'get-trip-status');
      return response;
    })
    .catch(InvalidRequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null,
          err.resultCode, err.error);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTrip(null, null,
          resultCodes.unknownError, 'unknown error ocurred');
      return response;
    });
};

TripsController.prototype.updateTripStatus = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'update-trip-status',
      request.status);
  var self = this;
  return validate
    .updateTripStatusRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getById(request.client_id);
      } else {
        log.log('Invalid update trip status received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.name : 'unknown';
      this.user = user;
      log.log('Update trip status (' + request.status + ') received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(t){
      if(t && tripBelongsToUser(t, this.user)) {
        log.setOrigin(t.user.id === request.client_id ? 'origin' : 'servicing');
        this.oldStatus = t.status;
        this.trip = TripThruApiFactory.createTripFromRequest(request,
            'update-trip-status', {trip: t});
        this.newStatus = this.trip.status;
        return trips.update(this.trip);
      }
      throw new InvalidRequestError(resultCodes.notFound, 'Trip not found');
    })
    .then(function(){
      if(shouldForwardUpdate(this.trip, this.oldStatus, this.newStatus)) {
        var sendTo = request.client_id === this.trip.user.id ?
            this.trip.servicingNetwork.id : this.trip.user.id;
        log.log('Trip has foreign dependency so forwarding update request to ' + sendTo);
        return self.gateway.updateTripStatus(sendTo, request);
      }
    })
    .then(function(response){
      if(this.trip.status === 'completed') {
        self.getTripStats(this.trip);
      }
      log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, function(err){
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
  var request = TripThruApiFactory.createRequestFromTrip(trip, 'get-trip-status');
  if(trip.servicingNetwork) {
    this
      .gateway
      .getTrip(trip.servicingNetwork.id, request)
      .then(function(response){
        trip = TripThruApiFactory.createTripFromResponse(response,
            'get-trip', {trip: trip});
        trips.update(trip);
      })
      .error(function(err){

      });
  }
};

function tripIsLocal(trip, request) {
  return trip.servicingNetwork &&
    trip.user.id === trip.servicingNetwork.id;
}

function shouldForwardUpdate(trip, currentStatus, newStatus) {
  return trip.servicingNetwork && trip.user.id !== trip.servicingNetwork.id;
}

function tripBelongsToUser(trip, user) {
  return (trip.user && trip.user.id === user.id) ||
          (trip.servicingNetwork && trip.servicingNetwork.id === user.id);
}

module.exports = new TripsController();