var activeTrips = require('../active_trips');
var tripsController = require('../controller/trips');
var usersController = require('../controller/users');
var logger = require('../logger');
var Promise = require('bluebird');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function Dashboard() {
  this.usersByToken = {};
  usersController
    .getAll()
    .bind(this)
    .then(function(allUsers){
      for(var i = 0; i < allUsers.length; i++) {
        var user = allUsers[i];
        this.usersByToken[user.token] = user;
      }
    });
}

Dashboard.prototype.getUser = function(token) {
  if(this.usersByToken.hasOwnProperty(token)){
    return Promise.resolve(this.usersByToken[token]);
  } else {
    return usersController
      .getByToken(token)
      .then(function(user){
        if(user) {
          this.usersByToken[user.token] = user;
        }
        return user;
      });
  }
};

Dashboard.prototype.getStats = function(token) {
  return this
    .getUser(token)
    .then(function(user){
      var response;
      if(user){
        var networkId = user.role === 'admin' || user.role === 'demo' ? 'all' : user.id;
        var trips = activeTrips.getAllDashboardTrips(networkId);
        var stats = getStatsFromTripList(trips);
        response = stats;
        response.result = resultCodes.ok;
      } else {
        response = { result: resultCodes.notFound };
      }
      return response;
    });
};

Dashboard.prototype.getTripsList = function(token, status) {
  return this
    .getUser(token)
    .then(function(user){
      var response;
      if(user){
        var networkId = user.role === 'admin' || user.role === 'demo' ? 'all' : user.id;
        status = status || 'all';
        var trips = activeTrips.getDashboardTrips(networkId, status);
        response = {
            trips: trips,
            result: resultCodes.ok
        };
      } else {
        response = { result: resultCodes.notFound };
      }
      return response;
    });
};

Dashboard.prototype.getTripStatus = function(token, id, callback) {
  return this
    .getUser(token)
    .then(function(user){
      var response;
      if(user){
        return tripsController.getTripStatus({id: id});
      } else {
        response = { result: resultCodes.notFound };
      }
      return response;
    })
    .then(function(response){
      return response;
    });
};

Dashboard.prototype.getTripRoute = function(token, id) {
  return this
    .getUser(token)
    .then(function(user){
      var response;
      var trip = activeTrips.getById(id);
      if(user && trip) {
        response = {
            result: resultCodes.ok
          };
        if(trip.driver) {
          response.historyEnrouteList = trip.driver.enrouteLocation;
          response.historyPickUpList = trip.driver.pickupLocation;
        }
      } else {
        response = { result: resultCodes.notFound };
      }
      return response;
    });
};

Dashboard.prototype.getNetworks = function(token) {
  return this
    .getUser(token)
    .then(function(user){
      var response;
      if(user) {
        return usersController.getNetworks();
      } else {
        response = { result: resultCodes.notFound };
      }
      return response;
    });
};

Dashboard.prototype.getTripLogs = function(token, id) {
  return this
    .getUser(token)
    .then(function(user){
      var response;
      if(user) {
        response = {
          result: resultCodes.ok,
          logs: logger.getLogsById(id)
        };
      } else {
        response = { result: resultCodes.notFound };
      }
      return response;
    });
};

function getStatsFromTripList(tripsById) {
  var stats = {
    activeTrips: Object.keys(tripsById).length,
    queued: 0,
    dispatched: 0,
    enroute: 0,
    pickedup: 0,
    complete: 0,
    cancelled: 0,
    rejected: 0,
    serviceLevels: [0, 0, 0, 0, 0]
  };
  stats['new'] = 0;
  
  var durations = [];
  var distances = [];
  for(var id in tripsById) {
    var trip = tripsById[id];
    if(trip) {
      stats[trip.status]++;
      if(trip.status === 'complete' || trip.status === 'pickedup') {
        stats.serviceLevels[trip.serviceLevel]++;
      }
      if(trip.status === 'complete') {
        durations.push(trip.duration);
        if(trip.distance >= 0) {
          // Sometimes we can reach this before updating the trip info after
          // calling get-trip-status on servicing network
          distances.push(trip.distance);
        }
      }
    }
  }
  if(durations.length > 0) {
    stats.durations = getFrequencyDistribution(durations, 5, 'min.');
  }
  if(distances.length > 0) {
    stats.distances = getFrequencyDistribution(distances, 5, 'mi');
  }
  return stats;
}


function sortNumber(a,b) {
  return a - b;
}

var getFrequencyDistribution = function(values, classes, dataTypeName) {
  values = values.sort(sortNumber);
  var max = values[values.length-1];
  var min = values[0];
  var interval = (max - min) / classes;
  interval = interval > 1 ? Math.ceil(interval) : interval;
  
  if(max === min) {
    return {
      name: '< '+ (Math.round(max * 100) / 100) + ' ' + dataTypeName, 
      value: values.length
    };
  }
  
  var boundary = min + interval;
  var valuesByClass = [];
  var valueIndex = 0;
  for(var i = 0; i < classes; i++) {
    var valuesInClass = 0;
    var inClass = true;
    while(inClass && valueIndex < values.length) {
      var v = values[valueIndex];
      if(v <= boundary) {
        valuesInClass++;
        valueIndex++;
      } else {
        inClass = false;
      }
    }
    valuesByClass.push({
      name: '< '+ (Math.round(boundary * 100) / 100) + ' ' + dataTypeName, 
      value: valuesInClass
    });
    boundary += interval;
  }
  return valuesByClass;
};

module.exports = new Dashboard();