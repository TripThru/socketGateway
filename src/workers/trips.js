var queue = require('./job_queue');
var tripPayments = require('../active_trip_payments');
var users = require('../controller/users');
var TripThruApiFactory = require('../tripthru_api_factory');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var moment = require('moment');
var logger = require('../logger');
var gateway; // Initialized with init to avoid circular dependency

function requestPayment(job, done) {
  var tripId = job.tripId;
  var sendTo = job.sendTo;
  var log = logger.getSublog(tripId, 'tripthru', 'servicing', 'request-payment');
  tripPayments
    .getByTripId(tripId)
    .then(function(tripPayment){
      if(tripPayment) {
        return forwardPaymentRequestToPartner(tripPayment, sendTo, log);
      } else {
        throw new Error('Trip payment not found');
      }
    })
    .catch(gateway.ConnectionError, function(err){
      log.log('ConnectionError request-payment ' + tripId + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error request-payment ' + tripId + ' : ' + err);
    })
    .finally(done);
}

function forwardPaymentRequestToPartner(tripPayment, sendTo, log) {
  var request = TripThruApiFactory.createRequestFromTripPayment(tripPayment, 'request-payment');
  return users
    .getById(sendTo)
    .then(function(user){
      var name = user ? user.name : 'unknown';
      log.log('Request payment to ' + name, request);
      return gateway.requestPayment(sendTo, request);
    })
    .then(function(res){
      log.log('Response', res);
      if( res.result_code !== resultCodes.ok && res.result_code !== resultCodes.rejected) {
        throw new gateway.ConnectionError(res.resultCode, res.error);
      }
      return res;
    });
}

function acceptPayment(job, done) {
  var tripId = job.tripId;
  var sendTo = job.sendTo;
  var log = logger.getSublog(tripId, 'tripthru', 'servicing', 'accept-payment');
  tripPayments
    .getByTripId(tripId)
    .then(function(tripPayment){
      if(tripPayment) {
        return forwardAcceptPaymentToPartner(tripPayment, sendTo, log);
      } else {
        throw new Error('Trip payment not found');
      }
    })
    .catch(gateway.ConnectionError, function(err){
      log.log('ConnectionError accept-payment ' + tripId + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error accept-payment ' + tripId + ' : ' + err);
    })
    .finally(done);
}

function forwardAcceptPaymentToPartner(tripPayment, sendTo, log) {
  var request = TripThruApiFactory.createRequestFromTripPayment(tripPayment, 'accept-payment');
  return users
    .getById(sendTo)
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Accept payment to ' + name, request);
      return gateway.acceptPayment(sendTo, request);
    })
    .then(function(res){
      log.log('Response', res);
      if( res.result_code !== resultCodes.ok && res.result_code !== resultCodes.rejected) {
        throw new gateway.ConnectionError(res.resultCode, res.error);
      }
      return res;
    });
}

function TripsJobQueue() {

}

module.exports = {
  init: function(gatewayClient) {
    gateway = gatewayClient;
    queue.processJob('request-payment', requestPayment);
    queue.processJob('accept-payment', acceptPayment);
  },
  newRequestPaymentJob: function(tripId, sendTo) {
    var data = {
        tripId: tripId,
        sendTo: sendTo
    };
    queue.newJob('request-payment', data);
  },
  newAcceptPaymentJob: function(tripId, sendTo) {
    var data = {
        tripId: tripId,
        sendTo: sendTo
    };
    queue.newJob('accept-payment', data);
  }
};