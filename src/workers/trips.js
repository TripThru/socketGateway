var queue = require('./job_queue');
var trips = require('../model/trips');
var convert = require('../convert');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var socket; // Initialized with init to avoid circular dependency

function dispatchTrip(job, done) {
  var tripId = job.tripId;
  trips
    .getById(tripId)
    .then(function(trip){
      var request = convert.toDispatchRequest(trip);
      return socket.dispatchTrip(trip.servicingPartner.id, request);
    })
    .then(function(res){
      if( res == resultCodes.ok )
        done();
      else 
        throw new socket.SocketError(res.resultCode, res.error);
    })
    .catch(socket.SocketError, function(err){
      console.log('SocketError dispatch ' + tripId + ' : ' + err);
    })
    .error(function(err){
      console.log('Error dispatching ' + tripId + ' : ' + err);
    });
}

function updateTripStatus(job, done){
  var request = job.request;
  var sendTo = job.sendTo;
  socket
    .updateTripStatus(sendTo, request)
    .then(function(res){
      if( res == resultCodes.ok )
        done();
      else 
        throw new socket.SocketError(res.resultCode, res.error);
    })
    .catch(socket.SocketError, function(err){
      console.log('SocketError update trip status ' + request.id + ' : ' + err);
    })
    .error(function(err){
      console.log('Error updating ' + request.id + ' : ' + err);
    });
}

module.exports = {
    init: function(gateway) {
      socket = gateway;
      queue.processJob('dispatch', dispatchTrip);
      queue.processJob('update-trip-status', updateTripStatus)
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
    }
}