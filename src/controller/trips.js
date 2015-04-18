var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var trips = require('../active_trips');
var tripsModel = require('../model/trips');
var tripPayments = require('../active_trip_payments');
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
        return users.getByClientId(request.client_id);
      } else {
        log.log('Invalid dispatch received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Dispatch received from ' + name, request);
      return trips.getById(this.trip.id);
    })
    .then(function(res){
      if(!res) {
        return trips.add(this.trip);
      }
      throw new InvalidRequestError(resultCodes.rejected, 'trip already exists');
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
        if(bestQuote.product) {
          this.trip.servicingProduct = bestQuote.product;
          this.trip.imageUrl = bestQuote.product.image_url;
        }
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
  //var log = logger.getSublog(request.id);
  var self = this;
  return validate
    .getTripStatusRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getByClientId(request.client_id);
      } else {
        //log.log('Invalid get trip status received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      //var name = user ? user.fullname : 'unknown';
      //log.log('Get trip status received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(t){
      this.trip = t;
      if(!this.trip) {
        throw new InvalidRequestError(resultCodes.rejected, 'trip ' + request.id + ' not found');
      } else if(!this.trip.servicingNetwork) {
        return { result_code: resultCodes.notFound };
      } else { 
        return self.gateway.getTripStatus(this.trip.servicingNetwork.id, request);
      }
    })
    .then(function(response){
      if(response.result_code === resultCodes.ok) {
        var res = 
          TripThruApiFactory.createGetTripStatusResponseFromNetworkGetTripStatusResponse(response, this.trip);
        //log.log('Response', res);
        return res;
      } else {
        throw(new UnsuccessfulRequestError(response.result_code, 'Unsuccessful request'));
      }
    })
    .catch(this.gateway.ConnectionError, UnsuccessfulRequestError, function(err){
      // If request to client fails, fall back to last known status
      var response = 
        TripThruApiFactory.createResponseFromTrip(this.trip, 'get-trip-status');
      //log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, function(err){
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
  return validate
    .updateTripStatusRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getByClientId(request.client_id);
      } else {
        log.log('Invalid update trip status received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Update trip status (' + request.status + ') received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(t){
      if(t) {
        log.setOrigin(
            t.originatingNetwork.id === request.client_id ? 'origin' : 'servicing');
        this.oldStatus = t.status;
        this.trip = TripThruApiFactory.createTripFromRequest(request, 
            'update-trip-status', {trip: t});
        this.newStatus = this.trip.status;
        return trips.update(this.trip);
      }
      throw new InvalidRequestError(resultCodes.rejected, 'trip not found');
    })
    .then(function(){
      if(shouldForwardUpdate(this.trip, this.oldStatus, this.newStatus)) {
        var sendTo = request.client_id === this.trip.originatingNetwork.id ?
            this.trip.servicingNetwork.id : this.trip.originatingNetwork.id;
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

TripsController.prototype.requestPayment = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'request-payment', 
      request.status);
  var self = this;
  return validate
    .requestPaymentRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getByClientId(request.client_id);
      } else {
        //log.log('Invalid request payment received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Payment request received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(trip){
      if(!trip) {
        throw new InvalidRequestError(resultCodes.notFound, 'trip not found');
      }
      this.tripPayment = TripThruApiFactory.createTripPaymentFromRequest(request, 
          'request-payment', {trip: trip});
      this.sendTo = trip.originatingNetwork.id;
      return tripPayments.add(this.tripPayment);
    })
    .then(function(){
      log.log('Forwarding payment request');
      return self.gateway.requestPayment(this.sendTo, request);
    })
    .then(function(response){
      log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTripPayment(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTripPayment(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

TripsController.prototype.requestPayment = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'request-payment', 
      request.status);
  var self = this;
  return validate
    .requestPaymentRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getByClientId(request.client_id);
      } else {
        //log.log('Invalid request payment received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Payment request received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(trip){
      if(!trip) {
        throw new InvalidRequestError(resultCodes.notFound, 'trip not found');
      }
      this.tripPayment = TripThruApiFactory.createTripPaymentFromRequest(request, 
          'request-payment', {trip: trip});
      this.sendTo = trip.originatingNetwork.id;
      return tripPayments.add(this.tripPayment);
    })
    .then(function(){
      workers.newRequestPaymentJob(this.tripPayment.tripId, this.sendTo);
      log.log('Created new request payment job');
      var response = TripThruApiFactory.createResponseFromTripPayment(this.tripPayment, 'request-payment');
      log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTripPayment(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTripPayment(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

TripsController.prototype.acceptPayment = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'accept-payment', 
      request.status);
  var self = this;
  return validate
    .acceptPaymentRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return users.getByClientId(request.client_id);
      } else {
        //log.log('Invalid accept payment received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Accept payment request received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(trip){
      if(!trip) {
        throw new InvalidRequestError(resultCodes.notFound, 'trip not found');
      }
      this.sendTo = trip.servicingNetwork.id;
      return tripPayments.getByTripId(request.id);
    })
    .then(function(tripPayment){
      if(!tripPayment) {
        throw new InvalidRequestError(resultCodes.notFound, 'trip payment request not found');
      }
      this.tripPayment = TripThruApiFactory.createTripPaymentFromRequest(request, 
          'accept-payment', {tripPayment: tripPayment});
      return tripPayments.update(this.tripPayment);
    })
    .then(function(){
      workers.newAcceptPaymentJob(this.tripPayment.tripId, this.sendTo);
      log.log('Created new accept payment job');
      var response = TripThruApiFactory.createResponseFromTripPayment(this.tripPayment, 'accept-payment');
      log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, function(err){
      var response = TripThruApiFactory.createResponseFromTripPayment(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromTripPayment(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

TripsController.prototype.getTripStats = function(trip) {
  var log = logger.getSublog(trip.id, 'tripthru', 'servicing', 'get-trip-status');
  var request = TripThruApiFactory.createRequestFromTrip(trip, 'get-trip-status');
  log.log('Get trip sent to ' + trip.servicingNetwork ? trip.servicingNetwork.id : ' unkwown', request);
  if(trip.servicingNetwork) {
    this
      .gateway
      .getTrip(trip.servicingNetwork.id, request)
      .then(function(response){
        trip = TripThruApiFactory.createTripFromResponse(response, 
            'get-trip', {trip: trip});
        trips.update(trip);
        log.log('Response', response);
      })
      .error(function(err){
        log.log('Response', err);
      });
  }
};

function tripIsLocal(trip, request) {
  return trip.servicingNetwork && 
    trip.originatingNetwork.id === trip.servicingNetwork.id;
}

function isActiveStatus(status) {
  return status === 'accepted' || status === 'en_route' || 
    status === 'picked_up';
}

function shouldForwardUpdate(trip, currentStatus, newStatus) {
  var shouldForward = trip.servicingNetwork && 
    trip.originatingNetwork.id !== trip.servicingNetwork.id;
  if(!isActiveStatus(currentStatus) && !isActiveStatus(newStatus)) {
    shouldForward = false;
  }
  return shouldForward;
}

module.exports = new TripsController();