var Promise = require('bluebird');
var promiseHelper = require('../promise_helper');
var mysql = require('mysql');
var logger = require('../logger');
var config = require('../../config').db;
var pool;

function execute(query, data) {
  var attempts = 0;
  return new Promise(function(resolve, reject){
    pool.getConnection(function(err, connection) {
      if(err) {
        reject(err);
        return;
      }
      if(attempts > 3) {
        logger.getSublog('store').log(err.code + ' : ' + 'Max attemps reached to commit transaction', err);
        reject(new Error('Max attemps to commit transaction exceeded'));
        return;
      }
      connection.query(mysql.format(query, data), function(err, result){
        if(err) {
          if(err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT') {
            logger.getSublog('store').log('Retrying transaction', err.code);
            execute(query, data).then(function(result){ resolve(result); }); 
          } else {
            logger.getSublog('store').log(err.code + ' : ' + mysql.format(query, data), err);
            reject(err);
          }
        } else {
          resolve(result);
        }
        connection.release();
      });
      attempts++;
    });
  });
}

function execute_sequence(queries) {
  return promiseHelper.runInSequence(queries, 
      function(query) { 
        return execute(query.query, query.data); 
      }
  );
}

function Store(){
  pool = mysql.createPool({
    connectionLimit: 300,
    waitForConnections: true,
    acquireTimeout: 30000,
    queueLimit: 0,
    host: config.host,
    database: config.database,
    user: config.user,
    password: config.password,
    connectTimeout: 30000
  });
}

Store.prototype.createTrip = function(trip) {
  var query = "INSERT INTO trips SET ?";
  var fields = {
    user_id: trip.userId,
    fleet_id: trip.fleetId, 
    vehicle_id: trip.vehicleId, 
    passenger_name: trip.passengerName, 
    trip_id: trip.id,
    pickup_location_lat: trip.pickupLocation.lat, 
    pickup_location_lng: trip.pickupLocation.lng, 
    pickup_time: trip.pickupTime,
    dropoff_location_lat: trip.dropoffLocation.lat, 
    dropoff_location_lng: trip.dropoffLocation.lng, 
    status: trip.status,  
    last_update: trip.lastUpdate, 
    autodispatch: trip.autoDispatch, 
    created_at: trip.creation,
    servicing_network_id: trip.servicingNetworkId, 
    servicing_fleet_id: trip.servicingFleetId, 
    dropoff_time: trip.dropoffTime,
    price: trip.price, 
    lateness_milliseconds: trip.latenessMilliseconds, 
    sampling_percentage: trip.samplingPercentage,
    service_level: trip.serviceLevel, 
    duration_seconds: trip.distance, 
    distance: trip.duration, 
    eta: trip.eta
  };
  var data = [fields];
  return execute(query, data);
};
  
Store.prototype.updateTrip = function(trip) {
  var queries = [];
  var fields = {
    status: trip.status,
    last_update: trip.lastUpdate,
    pickup_time: trip.pickupTime,
    lateness_milliseconds: trip.latenessMilliseconds,
    service_level: trip.serviceLevel,
    duration_seconds: trip.duration,
    distance: trip.distance,
    eta: trip.eta,
    servicing_network_id: trip.servicingNetworkId,
    servicing_fleet_id: trip.servicingFleetId,
    dropoff_time: trip.dropoffTime,
    price: trip.price
  };
  if(trip.driver) {
    fields.driver_name = trip.driver.name;
  }
  var query = "UPDATE trips SET ? WHERE id = ?";
  var data = [fields, trip.dbId];
  queries.push({query: query, data: data});

  if(trip.driver && trip.driver.location) {
    var locationUpdateQuery = "INSERT INTO trip_locations SET ? ";
    var locationData = {
      trip_id: trip.dbId,
      lat: trip.driver.location.lat,
      lng: trip.driver.location.lng
    };
    queries.push({query: locationUpdateQuery, data: locationData});
  }
  return execute_sequence(queries);
};
  
Store.prototype.getTripById = function(id) { 
  return execute( "SELECT t.*, " +
  		            "       u.client_id as user_client_id, " +
  		            "       u.full_name as user_name,  " +
  		            "       f.fleet_id as fleet_id, " +
  		            "       f.name as fleet_name " +
  		            "FROM trips t, users u, fleets f " +
  		            "WHERE trip_id LIKE ?",
  		            [id]);
};

Store.prototype.createTripPayment = function(tripPayment) {
  var query = "INSERT INTO trip_payment" +
  		        " SET trip_id = ? ," +
  		        "     user_id = (SELECT user_id FROM trips WHERE id = ?)," +  
  		        "     currency_code_id = (SELECT id FROM currency_codes WHERE code like ?)," +
  		        "     amount = ?," +
  		        "     requested_at = ?";
  var data = [tripPayment.tripDbId, 
              tripPayment.tripDbId, 
              tripPayment.currencyCode, 
              tripPayment.amount, 
              tripPayment.requestedAt];
  return execute(query, data);
};

Store.prototype.updateTripPayment = function(tripPayment) {
  var query = "UPDATE trip_payment SET ? WHERE trip_id = ?";
  var data = {
    confirmed: tripPayment.confirmation,
    tip: tripPayment.tip,
    confirmed_at: tripPayment.confirmedAt
  };
  return execute(query, [data, tripPayment.tripDbId]);
};

Store.prototype.getTripPaymentById = function(id) {
  throw new Error('Not implemented');
};

Store.prototype.getTripPaymentByTripId = function(id) {
  throw new Error('Not implemented');
};
  
Store.prototype.createQuote = function(quote) {
  throw new Error('Not implemented');
};
  
Store.prototype.updateQuote = function(quote) {
  throw new Error('Not implemented');
};
    
Store.prototype.getQuoteById = function(id) {
  throw new Error('Not implemented');
};
  
Store.prototype.updateUser = function(user) {
  return Promise
    .resolve(user)
    .then(function(user){
      var queries = [];
      for(var i = 0; i < user.fleets.length; i++) {
        var f = user.fleets[i];
        var query = "INSERT INTO fleets " +
                    "  (user_id, client_id, name, coverage_radius, coverage_lat, coverage_lng) " +
                    "VALUES (?, ?, ?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE " +
                    "  coverage_radius = VALUES(coverage_radius), " +
                    "  coverage_lat = VALUES(coverage_lat), " +
                    "  coverage_lng = VALUES(coverage_lng)";
        var data = [user.id, f.fleet_id, f.name, f.coverage.radius, f.coverage.center.lat, f.coverage.center.lng];
        queries.push({query: query, data: data});
      }
      return execute_sequence(queries);
    });
};

function getUserQuery() {
  return  "SELECT " +
  		    "  u.*, " +
          "  u.id as user_db_id, " +
          "  u.client_id as user_client_id, " +
          "  u.name as user_name, " +
          "  f.id as fleet_db_id, " + 
          "  f.client_id as fleet_client_id, " +
          "  f.name as fleet_name, " +
          "  f.* " +
          "FROM users u " +
          "LEFT JOIN fleets f ON u.id = f.user_id ";
} 
    
Store.prototype.getUserByClientId = function(client_id) {
  return execute(getUserQuery() + "WHERE u.client_id LIKE ?", [client_id]);
};

Store.prototype.getUserByToken = function(token) {
  return execute(getUserQuery() + "WHERE u.token LIKE ?", [token]);
};

Store.prototype.getAllUsers = function() {
  return execute(getUserQuery());
};
  
Store.prototype.clear = function() {
};

module.exports = new Store();