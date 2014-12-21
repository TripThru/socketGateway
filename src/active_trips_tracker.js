var moment = require('moment');

function ActiveTripsTracker() {
  this.activeTripsById = {};
  this.tripRemovalSpan = moment.duration(5, 'minutes');
}

ActiveTripsTracker.prototype.addTrip = function(trip) {
  if(this.activeTripsById.hasOwnProperty(trip.id)) {
    throw new Error('Trip ' + trip.id + ' already exists');
  }
  this.activeTripsById[trip.id] = trip;
};

ActiveTripsTracker.prototype.updateTrip = function(trip) { 
  if(!this.activeTripsById.hasOwnProperty(trip.id)) {
    throw new Error('Trip ' + trip.id + ' does not exist');
  }
  this.activeTripsById[trip.id] = trip;
  if(isNonActiveStatus(trip.status)) {
    this.deactivateTrip(trip);
  }
};

ActiveTripsTracker.prototype.deactivateTrip = function(trip) {
  if(!this.activeTripsById.hasOwnProperty(trip.id)) {
    throw new Error('Trip ' + trip.id + ' does not exist');
  }
  var activeTrips = this.activeTripsById;
  setTimeout(function(){
    var t = activeTrips[trip.id];
    if(t && isNonActiveStatus(t.status)) {
      delete activeTrips[trip.id];
    }
  }, this.tripRemovalSpan.asMilliseconds());
};

ActiveTripsTracker.prototype.getTrip = function(trip) {
  return this.activeTripsById[trip.id];
};

ActiveTripsTracker.prototype.getAll = function(status) {
  var trips = [];
  for(var id in this.activeTripsById) {
    var trip = this.activeTripsById[id];
    if(status === 'all' || trip.status === status) {
      trips.push(trip);
    }
  }
  return trips;
};

ActiveTripsTracker.prototype.getStats = function() {
  return {
    activeTrips: Object.keys(this.activeTripsById).length
  };
};

var isNonActiveStatus = function(status) {
  return status === 'complete' || status === 'rejected' || status === 'cancelled';
};

module.exports = new ActiveTripsTracker();