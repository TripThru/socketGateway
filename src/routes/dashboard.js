var activeTrips = require('../active_trips');
var tripsController = require('../controller/trips');
var usersController = require('../controller/users');
var logger = require('../logger');
var Promise = require('bluebird');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function Dashboard() {
  
}

Dashboard.prototype.getStats = function(token) {
  return usersController
    .getByToken(token)
    .then(function(user){
      if(user){
        var networkId = user.role === 'admin' || user.role === 'demo' ? 'all' : user.clientId;
        return activeTrips
          .getAll(networkId)
          .then(function(trips){
            var response = getStatsFromTripList(trips);
            response.result_code = resultCodes.ok;
            return response;
          });
      } else {
        return { result_code: resultCodes.notFound };
      }
    });
};

Dashboard.prototype.getTripsList = function(token, status) {
  return usersController
    .getByToken(token)
    .then(function(user){
      var response;
      if(user){
        var networkId = user.role === 'admin' || user.role === 'demo' ? 'all' : user.clientId;
        status = status || 'all';
        var trips = activeTrips.getDashboardTrips(networkId, status);
        response = {
            trips: trips,
            result_code: resultCodes.ok
        };
      } else {
        response = { result_code: resultCodes.notFound };
      }
      return response;
    });
};

Dashboard.prototype.getTripRoute = function(token, id) {
  return usersController
    .getByToken(token)
    .bind(this)
    .then(function(user){
      if(user) {
        return activeTrips
          .getById(id)
          .then(function(trip){
            var response = {
                result_code: resultCodes.ok
              };
            if(trip.driver) {
              response.routeEnrouteLocation = trip.driver.routeEnrouteLocation;
              response.routePickupLocation = trip.driver.routePickupLocation;
            }
            return response;
          });
      } else {
        return { result_code: resultCodes.notFound };
      }
    });
};

Dashboard.prototype.getTripLogs = function(token, id) {
  return usersController
    .getByToken(token)
    .then(function(user){
      var response;
      if(user) {
        response = {
          result_code: resultCodes.ok,
          logs: logger.getLogsById(id)
        };
      } else {
        response = { result_code: resultCodes.notFound };
      }
      return response;
    });
};

function getStatsFromTripList(trips) {
  var stats = {
    activeTrips: trips.length,
    queued: 0,
    accepted: 0,
    en_route: 0,
    picked_up: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    serviceLevels: [0, 0, 0, 0, 0]
  };
  stats['new'] = 0;
  
  var durations = [];
  var distances = [];
  for(var i = 0; i < trips.length; i++) {
    var trip = trips[i];
    if(trip) {
      stats[trip.status]++;
      if(trip.status === 'completed' || trip.status === 'picked_up') {
        stats.serviceLevels[trip.serviceLevel]++;
      }
      if(trip.status === 'completed') {
        durations.push(trip.duration);
        if(trip.distance >= 0) {
          // Sometimes we can reach this before updating the trip info after
          // calling get-trip on servicing network
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