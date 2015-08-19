var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var Promise = require('bluebird');
var trips = require('../active_trips');
var tripPayments = require('../active_trip_payments');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var logger = require('../logger');
var users = require('./users');
var currencyConversion = require('../currency_conversion');
var InvalidRequestError = require('../errors').InvalidRequestError;
var UnsuccessfulRequestError = require('../errors').UnsuccessfulRequestError;

function TripPayments() {
  this.gateway = null;
  this.expectedPaymentsById = {};
}

TripPayments.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.gateway = gatewayClient;
};

TripPayments.prototype.expectPayment = function(userId, tripId, estimate, currencyCode, log) {
  if(this.expectedPaymentsById.hasOwnProperty(tripId)) {
    throw new UnsuccessfulRequestError(resultCodes.rejected, 'Already expecting payment');
  }
  this.expectedPaymentsById[tripId] = {
    amount: estimate,
    currencyCode: currencyCode
  };
  return users
    .getById(userId)
    .bind({})
    .then(function(user){
      this.user = user;
      return currencyConversion.convert(estimate, currencyCode, user.currencyCode);
    })
    .then(function(convertedAmount){
      log.log('Rebalancing ' + this.user.name + ' wallet with quote estimate ' + estimate + currencyCode);
      log.log('Reserving quote high estimate ' + convertedAmount.toFixed(2) + this.user.currencyCode + ' until trip is completed');
      this.convertedAmount = convertedAmount;
      return users.getBalance(userId);
    })
    .then(function(balance){
      log.log('Balance decreased temporarily from ' + balance.toFixed(2) + this.user.currencyCode + ' to ' + (balance-this.convertedAmount).toFixed(2) + this.user.currencyCode);
      return users.decrementBalance(userId, this.convertedAmount, this.user.currencyCode);
    });
};

TripPayments.prototype._rebalanceWallets = function(tripPayment, trip, log) {
  var tipLog = tripPayment.tip ? (' plus ' + tripPayment.tip.amount.toFixed(2) + tripPayment.tip.currencyCode) + ' tip' : '';
  log.log('Transfering ' + tripPayment.amount.toFixed(2) + tripPayment.currencyCode + tipLog + ' from ' + trip.user.name + ' to ' + trip.servicingNetwork.id);

  return Promise
    .all([
      users.getBalance(trip.user.id),
      users.getById(trip.user.id)
    ])
    .bind({})
    .then(function(results){
      this.currentBalance = results[0];
      this.user = results[1];
      return Promise
        .all([
          currencyConversion.convert(tripPayment.amount, tripPayment.currencyCode, this.user.currencyCode),
          tripPayment.tip !== 0 ? currencyConversion.convert(tripPayment.tip.amount, tripPayment.tip.currencyCode, this.user.currencyCode) : Promise.resolve(null)
        ]);
    })
    .then(function(results){
      var convertedAmount = results[0];
      var convertedTipAmount = results[1];
      if(convertedTipAmount) {
        convertedAmount += convertedTipAmount;
      }
      this.originatorConvertedAmount = {
        amount: convertedAmount,
        currencyCode: this.user.currencyCode
      };
      if(tripPayment.currencyCode !== this.user.currencyCode || tripPayment.tip.currencyCode !== this.user.currencyCode) {
        var tipLog = convertedTipAmount ? (' plus ' + tripPayment.tip.amount.toFixed(2) + tripPayment.tip.currencyCode) : '';
        log.log('Converted ' + tripPayment.amount.toFixed(2) + tripPayment.currencyCode + tipLog + ' tip to ' + convertedAmount.toFixed(2) + this.user.currencyCode);
      }
      log.log(this.user.name + ' balance decreased from ' + this.currentBalance.toFixed(2) + this.user.currencyCode + ' to ' + (this.currentBalance - convertedAmount).toFixed(2) + this.user.currencyCode);
      return users.decrementBalance(trip.user.id, convertedAmount, this.user.currencyCode);
    })
    .then(function(){
      return Promise.all([
        users.getBalance(trip.servicingNetwork.id),
        users.getById(trip.servicingNetwork.id)
      ]);
    })
    .then(function(results){
      this.currentBalance = results[0];
      this.user = results[1];
      return currencyConversion.convert(this.originatorConvertedAmount.amount, this.originatorConvertedAmount.currencyCode, this.user.currencyCode)
    })
    .then(function(convertedAmount){
      if(this.user.currencyCode !== this.originatorConvertedAmount.currencyCode) {
        log.log('Converted ' + this.originatorConvertedAmount.amount.toFixed(2) + this.originatorConvertedAmount.currencyCode + ' to ' + convertedAmount.toFixed(2) + this.user.currencyCode);
      }
      log.log(this.user.name + ' balance increased from ' + this.currentBalance.toFixed(2) + this.user.currencyCode + ' to ' + (this.currentBalance + convertedAmount).toFixed(2) + this.user.currencyCode);
      return users.incrementBalance(trip.servicingNetwork.id, convertedAmount, this.user.currencyCode);
    });
};

TripPayments.prototype.tripWasCancelled = function(userId, trip, cancelledBy) {
  // Todo: Adjust balance if there's a cancellation fee
  var expectedAmount = this.expectedPaymentsById[trip.id];
  return users.incrementBalance(userId, expectedAmount.amount, expectedAmount.currencyCode);
};

TripPayments.prototype.requestPayment = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'request-payment',
      request.status);
  var self = this;
  return validate
    .requestPaymentRequest(request)
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
      var name = user ? user.name : 'unknown';
      log.log('Payment request received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(trip){
      if(!trip || !tripBelongsToUser(trip, this.user)) {
        throw new InvalidRequestError(resultCodes.notFound, 'Trip not found');
      }
      this.tripPayment = TripThruApiFactory.createTripPaymentFromRequest(request,
          'request-payment', {trip: trip});
      this.sendTo = trip.user.id;
      this.trip = trip;
      return tripPayments.create(this.tripPayment);
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

TripPayments.prototype.acceptPayment = function(request) {
  var log = logger.getSublog(request.id, null, 'tripthru', 'accept-payment',
      request.status);
  var self = this;
  return validate
    .acceptPaymentRequest(request)
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
      var name = user ? user.name : 'unknown';
      log.log('Accept payment received from ' + name, request);
      return trips.getById(request.id);
    })
    .then(function(trip){
      if(!trip || !tripBelongsToUser(trip, this.user)) {
        throw new InvalidRequestError(resultCodes.notFound, 'Trip not found');
      }
      this.trip = trip;
      return tripPayments.getByTripId(request.id);
    })
    .then(function(tripPayment){
      this.tripPayment = TripThruApiFactory.createTripPaymentFromRequest(request,
          'accept-payment', {tripPayment: tripPayment});
      this.sendTo = this.trip.servicingNetwork.id;
      return tripPayments.update(this.tripPayment);
    })
    .then(function(){
      return self._rebalanceWallets(this.tripPayment, this.trip, log);
    })
    .then(function(){
      log.log('Forwarding accept payment request');
      return self.gateway.acceptPayment(this.sendTo, request);
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

function tripBelongsToUser(trip, user) {
  return (trip.user && trip.user.id === user.id) ||
          (trip.servicingNetwork && trip.servicingNetwork.id === user.id);
}

module.exports = new TripPayments();