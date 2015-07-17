var Promise = require('bluebird');
var promiseHelper = require('../promise_helper');
var knex = require('knex');
var logger = require('../logger');
var config = require('../../config').db;

function Store(config){
  this.init(config);
}

Store.prototype.init = function(config) {
  this.db = knex({
    client: 'mysql',
    connection: {
      host: config.host,
      database: config.database,
      user: config.user,
      password: config.password,
    },
    pool: {
      min: 0,
      max: 300
    }
  });
};

Store.prototype.createTrip = function(trip) {
  var fields = {
    user_id: trip.userStoreId,
    product_id: trip.productStoreId,
    customer_name: trip.customer.name,
    trip_id: trip.id,
    pickup_location_lat: trip.pickupLocation.lat,
    pickup_location_lng: trip.pickupLocation.lng,
    pickup_location_description: trip.pickupLocation.description,
    pickup_time: trip.pickupTime,
    dropoff_location_lat: trip.dropoffLocation.lat,
    dropoff_location_lng: trip.dropoffLocation.lng,
    dropoff_location_description: trip.dropoffLocation.description,
    status: trip.status,
    last_update: trip.lastUpdate,
    autodispatch: trip.autoDispatch,
    created_at: trip.creation,
    servicing_network_id: trip.servicingNetwork ? trip.servicingNetwork.storeId : null,
    servicing_product_id: trip.servicingProduct ? trip.servicingProduct.storeId : null,
    dropoff_time: trip.dropoffTime,
    fare: trip.fare,
    lateness_milliseconds: trip.latenessMilliseconds,
    sampling_percentage: trip.samplingPercentage,
    service_level: trip.serviceLevel,
    duration_seconds: trip.duration,
    distance: trip.distance,
    eta: trip.eta,
    passengers: trip.passengers || -1,
    luggage: trip.luggage || -1,
    payment_method_code_id: this.raw("(SELECT id FROM payment_method_codes WHERE name LIKE ?)", [trip.paymentMethod])
  };
  if(trip.customer.id) fields.customer_id = trip.customer.id;
  if(trip.customer.localId) fields.customer_local_id = trip.customer.localId;
  if(trip.customer.phoneNumber) fields.customer_phone_number = trip.customer.phoneNumber;
  if(trip.guaranteedTip) {
    fields.guaranteed_tip_amount = trip.guaranteedTip.amount;
    fields.guaranteed_tip_currency_code_id = this.raw("(SELECT id FROM currency_codes WHERE name LIKE ?)", [trip.guaranteedTip.currencyCode])
  }
  return this.db('trips').insert(fields);
};

Store.prototype.updateTrip = function(trip) {
  var fields = {
    status: trip.status,
    last_update: trip.lastUpdate,
    pickup_time: trip.pickupTime,
    lateness_milliseconds: trip.latenessMilliseconds,
    service_level: trip.serviceLevel,
    duration_seconds: trip.duration,
    distance: trip.distance,
    eta: trip.eta,
    servicing_network_id: trip.servicingNetwork ? trip.servicingNetwork.storeId : null,
    servicing_product_id: trip.servicingProduct ? trip.servicingProduct.storeId : null,
    dropoff_time: trip.dropoffTime,
    fare: trip.fare
  };
  if(trip.driver) {
    if(trip.driver.name) fields.driver_name = trip.driver.name;
    if(trip.driver.id) fields.driver_id = trip.driver.id;
    if(trip.driver.localId) fields.driver_local_id = trip.driver.localId;
    if(trip.driver.nativeLanguage && trip.driver.nativeLanguage.id) fields.driver_native_language_id = trip.driver.nativeLanguage.id;
    if(trip.driver.phoneNumber) fields.driver_phone_number = trip.driver.phoneNumber;
  }
  return this
    .db('trips')
    .where('id', '=', trip.storeId)
    .update(fields)
    .bind(this)
    .then(function(res){
      if(trip.driver && trip.driver.location && trip.storeId) {
        var locationData = {
          trip_id: trip.storeId,
          lat: trip.driver.location.lat,
          lng: trip.driver.location.lng,
          description: trip.driver.location.description,
          datetime: trip.driver.location.datetime
        };
        return this.db('trip_locations').insert(locationData);
      }
    });
};

Store.prototype.getTripById = function(id) {
  return this
    .db('trips')
    .where('trip_id', '=', id)
    .innerJoin('users', 'trips.user_id', 'users.id')
    .innerJoin('products', 'trips.product_id', 'products.id')
    .select('trips.*',
            this.raw("(SELECT name from currency_codes WHERE id = trips.guaranteed_tip_currency_code_id) as guaranteed_tip_currency_code"),
            this.raw("(SELECT name from payment_method_codes WHERE id = trips.payment_method_code_id) as payment_method"),
            'users.client_id AS user_client_id',
            'users.full_name AS user_name',
            'products.id as product_id',
            'products.name as product_name');
};

Store.prototype.getTripLocations = function(id) {
  return this
    .db('trip_locations')
    .where('trip_id', '=', this.raw("(SELECT id from trips WHERE trip_id = ?)", [id]))
    .select('*');
};

Store.prototype.createTripPayment = function(tripPayment) {
  return this
    .db('trip_payment')
    .insert({
      trip_id: tripPayment.trip.storeId,
      user_id: this.raw("(SELECT user_id FROM trips WHERE id = ?)", [tripPayment.trip.storeId]),
      currency_code_id: this.raw("(SELECT id FROM currency_codes WHERE name LIKE ?)", [tripPayment.currencyCode]),
      amount: tripPayment.amount,
      requested_at: tripPayment.requestedAt
    });
};

Store.prototype.updateTripPayment = function(tripPayment) {
  return this
    .db('trip_payment')
    .whereRaw('trip_id LIKE ?', [tripPayment.trip.storeId])
    .update({
      confirmed: tripPayment.confirmed,
      tip: tripPayment.tip,
      confirmed_at: tripPayment.confirmedAt
    });
};

Store.prototype.getTripPaymentByTripId = function(id) {
  return this
    .db('trip_payment')
    .where('trip_id', '=', this.raw("(SELECT id from trips WHERE trip_id = ?)", [id]))
    .select('trip_payment.*',
            this.raw("(SELECT name from currency_codes WHERE id = trip_payment.currency_code_id) as currency_code")
    );
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

Store.prototype.createUser = function(user) {
  return this
    .db('users')
    .insert({
      client_id: user.clientId,
      name: user.name,
      full_name: user.fullName,
      password_digest: user.passwordHash,
      email: user.email,
      token: user.token,
      role: user.role,
      endpoint_type: user.endpointType,
      callback_url: user.callbackUrl,
      created_at: user.creation,
      updated_at: user.lastUpdate
    });
}

Store.prototype.updateUser = function(user) {
  return this
    .db('users')
    .where('client_id', '=', user.clientId)
    .update({
      full_name: user.fullName,
      callback_url: user.callbackUrl
    })
    .bind(this)
    .then(function(res){
      var updatedProducts = user.products.map(function(product){
        return product.clientId;
      });
      var deleteOldProducts = this.db('products')
        .where('user_id', '=', user.storeId)
        .andWhere(function(){
          this.whereNotIn('client_id', updatedProducts);
        })
        .del();
      return deleteOldProducts;
    })
    .then(function(res){
      var db = this.db;
      var insertOrUpdate = Promise.resolve();
      for(var i = 0; i < user.products.length; i++) {
        (function(p){
          var query = "INSERT INTO products " +
                      "  (user_id, client_id, name, coverage_radius, coverage_lat, coverage_lng, image_url, capacity, accepts_prescheduled, accepts_ondemand, accepts_cash_payment, accepts_account_payment, accepts_creditcard_payment) " +
                      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                      "ON DUPLICATE KEY UPDATE " +
                      "  name = VALUES(name), " +
                      "  coverage_radius = VALUES(coverage_radius), " +
                      "  coverage_lat = VALUES(coverage_lat), " +
                      "  coverage_lng = VALUES(coverage_lng), " +
                      "  image_url = VALUES(image_url), " +
                      "  capacity = VALUES(capacity), " +
                      "  accepts_prescheduled = VALUES(accepts_prescheduled), " +
                      "  accepts_ondemand = VALUES(accepts_ondemand), " +
                      "  accepts_cash_payment = VALUES(accepts_cash_payment), " +
                      "  accepts_account_payment = VALUES(accepts_account_payment), " +
                      "  accepts_creditcard_payment = VALUES(accepts_creditcard_payment)";
          var data = [
                        user.storeId,
                        p.clientId,
                        p.name,
                        p.coverage ? p.coverage.radius : null,
                        p.coverage ? p.coverage.center.lat : null,
                        p.coverage ? p.coverage.center.lng : null,
                        p.imageUrl,
                        p.capacity,
                        p.acceptsPrescheduled,
                        p.acceptsOndemand,
                        p.acceptsCashPayment,
                        p.acceptsAccountPayment,
                        p.acceptsCreditcardPayment
                       ];
          insertOrUpdate = insertOrUpdate
                              .then(function(){
                                return db.raw(query, data);
                              });
        })(user.products[i]);
      }
      return insertOrUpdate;
    });
};

Store.prototype.getUserByClientId = function(client_id) {
  return this
    .db('users')
    .where('users.client_id', client_id)
    .leftJoin('products', 'users.id', 'products.user_id')
    .select('users.*',
            'users.id as user_db_id',
            'users.client_id as user_client_id',
            'users.name as user_name',
            'users.callback_url as callback_url',
            'products.id as product_db_id',
            'products.client_id as product_client_id',
            'products.name as product_name',
            'products.*');
};

Store.prototype.getUserByToken = function(token) {
  return this
    .db('users')
    .where('token', token)
    .leftJoin('products', 'users.id', 'products.user_id')
    .select('users.*',
            'users.id as user_db_id',
            'users.client_id as user_client_id',
            'users.name as user_name',
            'users.callback_url as callback_url',
            'products.id as product_db_id',
            'products.client_id as product_client_id',
            'products.name as product_name',
            'products.*');
};

Store.prototype.getAllUsers = function() {
  return this.db('users').select('*');
};

Store.prototype.raw = function(query, bindings) {
  return this.db.raw(query, bindings);
};

Store.prototype.clear = function() {

};

module.exports = new Store(config);