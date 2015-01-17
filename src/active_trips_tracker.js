var moment = require('moment');

function ActiveTripsTracker() {
  this.activeTripsById = {};
  this.tripRemovalSpan = moment.duration(5, 'minutes');
  this.dashboardTripsByIdByStatus = {
      _new: {},
      queued: {},
      dispatched: {},
      enroute: {},
      pickedup: {},
      complete: {},
      cancelled: {},
      rejected: {}
  };
  this.maxDashboardTrips = 150;
  this.bookingWebsiteTripTag = 'web'; // Used to identify trips generated by demo website to ensure they show up on dashboard
}

ActiveTripsTracker.prototype.addTrip = function(trip) {
  if(this.activeTripsById.hasOwnProperty(trip.id)) {
    throw new Error('Trip ' + trip.id + ' already exists');
  }
  this.activeTripsById[trip.id] = trip;
  this.addDashboardTrip(trip);
};

ActiveTripsTracker.prototype.getDashboardTripListByStatus = function(status) {
  var triplist = status === 'new' ? 
      this.dashboardTripsByIdByStatus._new : 
      this.dashboardTripsByIdByStatus[status];
  return triplist;
};

ActiveTripsTracker.prototype.addDashboardTrip = function(trip) {
  var triplist = this.getDashboardTripListByStatus(trip.status);
  if(triplist && Object.keys(triplist).length < this.maxDashboardTrips && 
        !triplist.hasOwnProperty(trip.id)) {
    triplist[trip.id] = trip;
  }
};

ActiveTripsTracker.prototype.updateTrip = function(trip) { 
  if(!this.activeTripsById.hasOwnProperty(trip.id)) {
    throw new Error('Trip ' + trip.id + ' does not exist');
  }
  this.activeTripsById[trip.id] = trip;
  this.updateDashboardTrip(trip);
  if(isNonActiveStatus(trip.status)) {
    this.deactivateTrip(trip);
  }
};

ActiveTripsTracker.prototype.updateDashboardTrip = function(trip) {
  this.deleteDashboardTripFromPreviousLists(trip);
  this.addDashboardTrip(trip);
};

ActiveTripsTracker.prototype.deleteDashboardTripFromPreviousLists = function(trip) {
  for(var id in this.dashboardTripsByIdByStatus){
    delete this.dashboardTripsByIdByStatus[id][trip.id];
  }
};

ActiveTripsTracker.prototype.deactivateTrip = function(trip) {
  if(!this.activeTripsById.hasOwnProperty(trip.id)) {
    throw new Error('Trip ' + trip.id + ' does not exist');
  }
  var self = this;
  setTimeout(function(){
    var t = self.activeTripsById[trip.id];
    if(t && isNonActiveStatus(t.status)) {
      delete self.activeTripsById[trip.id];
      self.deleteDashboardTrip(trip);
    }
  }, this.tripRemovalSpan.asMilliseconds());
};

ActiveTripsTracker.prototype.deleteDashboardTrip = function(trip) {
  var triplist = this.getDashboardTripListByStatus(trip.status);
  if(triplist && triplist.hasOwnProperty(trip.id)) {
    delete triplist[trip.id];
  }
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

function pushTrips(triplist, tripsToPush) {
  for(var id in tripsToPush) {
    triplist.push(tripsToPush[id]);
  }
  return triplist;
}

// Smaller list used by the website dashboard
ActiveTripsTracker.prototype.getDashboardTrips = function(status) {
  var trips = [];
  if(status === 'new' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus._new);
  }
  if(status === 'queued' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus.queued);
  }
  if(status === 'dispatched' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus.dispatched);
  }
  if(status === 'enroute' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus.enroute);
  }
  if(status === 'pickedup' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus.pickedup);
  }
  if(status === 'cancelled' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus.cancelled);
  }
  if(status === 'rejected' || status === 'all') {
    pushTrips(trips, this.dashboardTripsByIdByStatus.rejected);
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