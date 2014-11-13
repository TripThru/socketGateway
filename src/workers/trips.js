var queue = require('./job_queue');
var trips = require('../model/trips');
var convert = require('../convert');
var socket = require('../socket');
SocketError = socket.SocketError;
var codes = require('../codes');
var resultCodes = codes.resultCodes;

queue.processJob('dispatch', function(job, done){
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
        throw new SocketError(res.resultCode, res.error);
    })
    .catch(SocketError, function(err){
      console.log('SocketError updating ' + tripId + ' : ' + err);
    })
    .error(function(err){
      console.log('Error dispatching ' + tripId + ' : ' + err);
    });
});

queue.processJob('update-trip-status', function(job, done){
  var request = job.request;
  var sendTo = job.sendTo;
  socket
    .updateTripStatus(sendTo, request)
    .then(function(res){
      if( res == resultCodes.ok )
        done();
      else 
        throw new SocketError(res.resultCode, res.error);
    })
    .catch(SocketError, function(err){
      console.log('SocketError updating ' + request.id + ' : ' + err);
    })
    .error(function(err){
      console.log('Error updating ' + request.id + ' : ' + err);
    });
});

module.exports = {
    
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