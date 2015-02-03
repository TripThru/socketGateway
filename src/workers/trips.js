var queue = require('./job_queue');
var trips = require('../active_trips');
var quotes = require('../active_quotes');
var TripThruApiFactory = require('../tripthru_api_factory');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var moment = require('moment');
var logger = require('../logger');
var socket; // Initialized with init to avoid circular dependency
var quotesJobQueue; // Initialized with init to avoid circular dependency

function dispatchTrip(job, done) {
  var tripId = job.tripId;
  var log = logger.getSublog(tripId, 'tripthru', 'servicing', 'dispatch');
  trips
    .getById(tripId)
    .then(function(trip){
      if(trip) {
        return forwardDispatchToPartner(trip, log);
      } else {
        throw new Error('Trip not found');
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
  trips
    .getById(request.id)
    .then(function(trip){
      var destination = null;
      if(trip) {
        destination = trip.originatingPartner.id === sendTo ? 'origin' : 'servicing';
      }
      var log = logger.getSublog(request.id, 'tripthru', destination, 
          'update-trip-status', request.status);
      return forwardUpdateToPartner(sendTo, request, log);
    })
    .catch(socket.SocketError, function(err){
      log.log('SocketError update trip status ' + request.id + ' : ' + err.error);
    })
    .error(function(err){
      log.log('Error updating ' + request.id + ' : ' + err);
    })
    .finally(done);
}

function autoDispatchTrip(job, done) {
  var tripId = job.tripId;
  var servicingPartner = job.servicingPartner;
  var servicingFleet = job.servicingFleet;
  var log = logger.getSublog(tripId, 'tripthru');
  var promise;
  
  if(servicingPartner) {
    log.setDestination('servicing');
    log.setType('dispatch');
    promise = dispatchTripAndUpdatePartner(tripId, servicingPartner, servicingFleet, log);
  } else {
    log.setDestination('origin');
    log.setType('update-trip-status');
    log.setStatus('rejected');
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
        return trips.update(this.trip);
      } else {
        throw new Error('Autodispatch trip ' + tripId + ' not found');
      }
    })
    .then(function(result){
      var request = TripThruApiFactory.createRequestFromTrip(this.trip, 
          'update-trip-status');
      log.log('No best quote found so rejecting trip', request);
      return forwardUpdateToPartner(this.trip.originatingPartner.id, request, log);
    });
}

function forwardUpdateToPartner(sendTo, request, log) {
  log.log('Update trip status (' + request.status + ') forwarded to ' + sendTo, request);
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
  log.log('Dispatch to ' + trip.servicingPartner.id, request);
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