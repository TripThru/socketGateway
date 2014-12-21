var queue = require('./job_queue');
var trips = require('../model/trips');
var quotes = require('../model/quotes');
var TripThruApiFactory = require('../tripthru_api_factory');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var activeTripsTracker = require('../active_trips_tracker');
var moment = require('moment');
var logger = require('../logger');
var socket; // Initialized with init to avoid circular dependency
var quotesJobQueue; // Initialized with init to avoid circular dependency

function dispatchTrip(job, done) {
  var tripId = job.tripId;
  var log = logger.getSublog(tripId);
  log.log('Processing dispatch job ' + tripId, job);
  trips
    .getById(tripId)
    .then(function(trip){
      if(trip) {
        if(!trip.autoDispatch) {
          return forwardDispatchToPartner(trip, log);
        } else {
          log.log('Since trip is autodispatch create quote job');
          return createQuoteAutoDispatchJob(trip);
        }
      } else {
        throw new Error('Trip ' + tripId + ' not found');
      }
    })
    .then(done)
    .catch(socket.SocketError, function(err){
      log.log('SocketError dispatch ' + tripId + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error dispatching ' + tripId + ' : ' + err);
    });
}

function updateTripStatus(job, done){
  var request = job.request;
  var sendTo = job.sendTo;
  var log = logger.getSublog(request.id);
  log.log('Processing update trip status job ' + request.id, job);
  forwardUpdateToPartner(sendTo, request, log)
    .then(done)
    .catch(socket.SocketError, function(err){
      log.log('SocketError update trip status ' + request.id + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error updating ' + request.id + ' : ' + err);
    });
}

function createQuoteAutoDispatchJob(trip) {
  var quote = TripThruApiFactory.createQuoteFromTrip(trip);
  return quotes
    .add(quote)
    .then(function(){
      quotesJobQueue.newAutoDispatchJob(quote.id);
    });
}

function autoDispatchTrip(job, done) {
  var tripId = job.tripId;
  var servicingPartner = job.servicingPartner;
  var log = logger.getSublog(tripId);
  var promise;
  
  log.log('Processing autodispatch job ' + tripId, job);
  if(servicingPartner) {
    promise = dispatchTripAndUpdatePartner(tripId, servicingPartner, log);
  } else {
    log.log('No best quote found so rejecting trip');
    promise = rejectTripAndUpdate(tripId, servicingPartner, log);
  }
  
  promise
    .then(done)
    .catch(socket.SocketError, function(err){
      log.log('SocketError autodispatch ' + tripId + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error autodispatch ' + tripId + ' : ' + err);
    });
}

function dispatchTripAndUpdatePartner(tripId, servicingPartner, log) {
  return trips
    .getById(tripId)
    .bind({})
    .then(function(trip){
      if(trip) {
        trip.servicingPartner = servicingPartner;
        this.trip = trip;
        return trips.update(this.trip);
      } else {
        throw new Error('Autodispatch trip ' + tripId + ' not found');
      }
    })
    .then(function(){
      return forwardDispatchToPartner(this.trip, log);
    })
    .then(function(res){
      this.trip.status = res.result === resultCodes.ok ? 
          'dispatched' : 'rejected';
      log.log('Trip status updated to ' + this.trip.status);
      return trips.update(this.trip);
    })
    .then(function(result){
      if(this.trip.status === 'rejected') { // if trip is dispatched servicing partner should do update
        var request = TripThruApiFactory.createRequestFromTrip(this.trip, 
            'update-trip-status');
        return forwardUpdateToPartner(this.trip.originatingPartner.id, request, log);
      }
    });
}

function rejectTripAndUpdate(tripId, servicingPartner, log) {
  return trips
    .getById(tripId)
    .bind({})
    .then(function(trip){
      if(trip) {
        if(servicingPartner) trip.servicingPartner = servicingPartner;
        trip.status = 'rejected';
        this.trip = trip;
        this.trip.lastUpdate = moment();
        log.log('Trip status updated to ' + this.trip.status);
        activeTripsTracker.updateTrip(this.trip);
        return trips.update(this.trip);
      } else {
        throw new Error('Autodispatch trip ' + tripId + ' not found');
      }
    })
    .then(function(result){
      var request = TripThruApiFactory.createRequestFromTrip(this.trip, 
          'update-trip-status');
      return forwardUpdateToPartner(this.trip.originatingPartner.id, request, log);
    });
}

function forwardUpdateToPartner(sendTo, request, log) {
  log.log('Forward update trip status to ' + sendTo, request);
  return socket
    .updateTripStatus(sendTo, request)
    .then(function(res){
      log.log('Response', res);
      if( res.result !== resultCodes.ok )
        throw new socket.SocketError(res.resultCode, res.error);
      return res;
    });
}

function forwardDispatchToPartner(trip, log) {
  var request = TripThruApiFactory.createRequestFromTrip(trip, 'dispatch');
  log.log('Forward dispatch to ' + trip.servicingPartner.id, request);
  return socket
    .dispatchTrip(trip.servicingPartner.id, request)
    .then(function(res){
      log.log('Response', res);
      if( res.result !== resultCodes.ok && res.result !== resultCodes.rejected)
        throw new socket.SocketError(res.resultCode, res.error);
      return res;
    });
}

function TripsJobQueue() {
  
}

module.exports = {
  init: function(gateway, quotesJQ) {
    socket = gateway;
    quotesJobQueue = quotesJQ;
    queue.processJob('dispatch', dispatchTrip);
    queue.processJob('update-trip-status', updateTripStatus);
    queue.processJob('autodispatch-trip', autoDispatchTrip);
  },
  newDispatchJob: function(tripId) {
    var data = { tripId: tripId };
    queue.newJob('dispatch', data);
  },
  newUpdateTripStatusJob: function(request, receiverId) {
    var data = {
        request: request,
        sendTo: receiverId
    };
    queue.newJob('update-trip-status', data);
  },
  newAutoDispatchJob: function(tripId, servicingPartnerId) {
    var data = {
        tripId: tripId
    };
    if(servicingPartnerId){
      data.servicingPartner = { id: servicingPartnerId };
    }
    queue.newJob('autodispatch-trip', data);
  }
};