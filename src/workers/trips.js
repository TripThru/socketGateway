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
  var log = logger.getSublog(tripId, 'tripthru');
  log.log('Processing dispatch job ' + tripId, job);
  trips
    .getById(tripId)
    .then(function(trip){
      if(trip) {
        if(!trip.autoDispatch) {
          log.setDestination('servicing');
          log.setType('dispatch');
          return forwardDispatchToPartner(trip, log);
        } else {
          log.log('Since trip is autodispatch create quote job');
          return createQuoteAutoDispatchJob(trip);
        }
      } else {
        throw new Error('Trip ' + tripId + ' not found');
      }
    })
    .catch(socket.SocketError, function(err){
      log.log('SocketError dispatch ' + tripId + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error dispatching ' + tripId + ' : ' + err);
    })
    .finally(done);
}

function updateTripStatus(job, done){
  var request = job.request;
  var sendTo = job.sendTo;
  
  var trip = activeTripsTracker.getTrip(request);
  var destination = null;
  if(trip) {
    destination = trip.originatingPartner.id === sendTo ? 'servicing' : 'origin';
  }
  var log = logger.getSublog(request.id, 'tripthru', destination, 'update-trip-status');
  
  log.log('Processing update trip status job ' + request.id, job);
  forwardUpdateToPartner(sendTo, request, log)
    .catch(socket.SocketError, function(err){
      log.log('SocketError update trip status ' + request.id + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error updating ' + request.id + ' : ' + err);
    })
    .finally(done);
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
  var servicingFleet = job.servicingFleet;
  var log = logger.getSublog(tripId);
  var promise;
  
  log.log('Processing autodispatch job ' + tripId, job);
  if(servicingPartner) {
    promise = dispatchTripAndUpdatePartner(tripId, servicingPartner, servicingFleet, log);
  } else {
    log.log('No best quote found so rejecting trip');
    promise = rejectTripAndUpdate(tripId, servicingPartner, log);
  }
  
  promise
    .catch(socket.SocketError, function(err){
      log.log('SocketError autodispatch ' + tripId + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error autodispatch ' + tripId + ' : ' + err);
    })
    .finally(done);
}

function dispatchTripAndUpdatePartner(tripId, servicingPartner, servicingFleet, log) {
  return trips
    .getById(tripId)
    .bind({})
    .then(function(trip){
      if(trip) {
        trip.servicingPartner = servicingPartner;
        trip.servicingFleet = servicingFleet;
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
  newAutoDispatchJob: function(tripId, servicingPartner, servicingFleet) {
    var data = {
        tripId: tripId,
        servicingPartner: servicingPartner,
        servicingFleet: servicingFleet
    };
    queue.newJob('autodispatch-trip', data);
  }
};