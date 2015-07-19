var Promise = require('bluebird');
var promiseHelper = require('../promise_helper');
var knex = require('knex');
var logger = require('../logger');

function Store(){

}

Store.prototype.init = function(config) {
  if(!this.db) {
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
  }
};

Store.prototype.createTrip = function(trip) {
  var fields = {
    trip_id: trip.id,
    user_id: this.raw('(SELECT id FROM users WHERE client_id = ?)', [trip.user.id]),
    product_id: this.raw('(SELECT id FROM products WHERE client_id = ?)', [trip.product.id]),
    customer_name: trip.customer.name,
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
    servicing_network_id: trip.servicingNetwork ? this.raw('(SELECT id FROM users WHERE client_id = ?)', [trip.servicingNetwork.id]) : null,
    servicing_product_id: trip.servicingProduct ? this.raw('(SELECT id FROM products WHERE client_id = ?)', [trip.servicingProduct.id]) : null,
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
    payment_method_code_id: this.raw("(SELECT id FROM payment_method_codes WHERE name = ?)", [trip.paymentMethod])
  };
  if(trip.customer.id) fields.customer_id = trip.customer.id;
  if(trip.customer.localId) fields.customer_local_id = trip.customer.localId;
  if(trip.customer.phoneNumber) fields.customer_phone_number = trip.customer.phoneNumber;
  if(trip.guaranteedTip) {
    fields.guaranteed_tip_amount = trip.guaranteedTip.amount;
    fields.guaranteed_tip_currency_code_id = this.raw("(SELECT id FROM currency_codes WHERE name = ?)", [trip.guaranteedTip.currencyCode])
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
    servicing_network_id: trip.servicingNetwork ? this.raw('(SELECT id FROM users WHERE client_id = ?)', [trip.servicingNetwork.id]) : null,
    servicing_product_id: trip.servicingProduct ? this.raw('(SELECT id FROM products WHERE client_id = ?)', [trip.servicingProduct.id]) : null,
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
    .where('trip_id', trip.id)
    .update(fields);
};

Store.prototype.getTripById = function(id) {
  return this
    .db('trips')
    .where('trip_id', id)
    .innerJoin('users', 'trips.user_id', 'users.id')
    .innerJoin('products', 'trips.product_id', 'products.id')
    .select('trips.*',
            'trips.trip_id as id',
            this.raw("(SELECT name from currency_codes WHERE id = trips.guaranteed_tip_currency_code_id) as guaranteed_tip_currency_code"),
            this.raw("(SELECT name from payment_method_codes WHERE id = trips.payment_method_code_id) as payment_method"),
            this.raw("(SELECT client_id from users WHERE id = trips.servicing_network_id) as servicing_network_id"),
            this.raw("(SELECT client_id from products WHERE id = trips.servicing_product_id) as servicing_product_id"),
            'users.client_id as user_id',
            'users.full_name as user_name',
            'products.client_id as product_id',
            'products.name as product_name');
};

Store.prototype.createTripLocation = function(tripId, location) {
  return this
    .db('trip_locations')
    .insert({
      trip_id: this.raw('(SELECT id FROM trips WHERE trip_id = ?)', [tripId]),
      lat: location.lat,
      lng: location.lng,
      description: location.description,
      datetime: location.datetime
    });
};

Store.prototype.getTripLocations = function(id) {
  return this
    .db('trip_locations')
    .whereRaw('trip_id = (SELECT id from trips WHERE trip_id = ?)', [id])
    .select('*');
};

Store.prototype.createTripPayment = function(tripPayment) {
  return this
    .db('trip_payment')
    .insert({
      trip_id: this.raw('(SELECT id FROM trips WHERE trip_id = ?)', [tripPayment.trip.id]),
      user_id: this.raw('(SELECT user_id FROM trips WHERE trip_id = ?)', [tripPayment.trip.id]),
      currency_code_id: this.raw("(SELECT id FROM currency_codes WHERE name = ?)", [tripPayment.currencyCode]),
      amount: tripPayment.amount,
      requested_at: tripPayment.requestedAt
    });
};

Store.prototype.updateTripPayment = function(tripPayment) {
  return this
    .db('trip_payment')
    .whereRaw('trip_id = (SELECT id FROM trips WHERE trip_id = ?)', [tripPayment.trip.id])
    .update({
      confirmed: tripPayment.confirmed,
      tip: tripPayment.tip,
      confirmed_at: tripPayment.confirmedAt
    });
};

Store.prototype.getTripPaymentByTripId = function(id) {
  return this
    .db('trip_payment')
    .whereRaw('trip_id = (SELECT id from trips WHERE trip_id = ?)', [id])
    .select('trip_payment.*',
            this.raw("(SELECT name from currency_codes WHERE id = trip_payment.currency_code_id) as currency_code"),
            this.raw("(SELECT client_id from users WHERE id = trip_payment.user_id) as user_id"),
            this.raw(" ? as trip_id", [id])
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
      client_id: user.id,
      name: user.id,
      full_name: user.name,
      email: user.email,
      password_digest: user.passwordHash,
      token: user.token,
      role: user.role,
      endpoint_type: user.endpointType,
      callback_url: user.callbackUrl,
      created_at: user.createdAt,
      updated_at: user.updatedAt
    });
}

Store.prototype.updateUser = function(user) {
  return this
    .db('users')
    .where('client_id', user.id)
    .update({
      full_name: user.name,
      callback_url: user.callbackUrl
    });
};

Store.prototype._deleteOldProducts = function(userId, newProductsIds) {
  return this.
    db('products')
    .whereRaw('user_id = (SELECT id FROM users WHERE client_id = ?)', [userId])
    .andWhere(function(){
      this.whereNotIn('client_id', newProductsIds);
    })
    .del();
};

Store.prototype.updateProducts = function(userId, products) {
  var self = this;
  var createOrUpdate = this._deleteOldProducts(userId, products.map(function(p){ return p.id }));
  var userIdQuery = this.raw("(SELECT id FROM users WHERE client_id = ?)", [userId]);
  for(var i = 0; i < products.length; i++) {
    (function(p){
      var query = "INSERT INTO products " +
                  "  (user_id, client_id, name, image_url, capacity, accepts_prescheduled, accepts_ondemand, accepts_cash_payment, accepts_account_payment, accepts_creditcard_payment) " +
                  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                  "ON DUPLICATE KEY UPDATE " +
                  "  name = VALUES(name), " +
                  "  image_url = VALUES(image_url), " +
                  "  capacity = VALUES(capacity), " +
                  "  accepts_prescheduled = VALUES(accepts_prescheduled), " +
                  "  accepts_ondemand = VALUES(accepts_ondemand), " +
                  "  accepts_cash_payment = VALUES(accepts_cash_payment), " +
                  "  accepts_account_payment = VALUES(accepts_account_payment), " +
                  "  accepts_creditcard_payment = VALUES(accepts_creditcard_payment)";
      var data = [
                    userIdQuery,
                    p.id,
                    p.name,
                    p.imageUrl,
                    p.capacity,
                    p.acceptsPrescheduled,
                    p.acceptsOndemand,
                    p.acceptsCashPayment,
                    p.acceptsAccountPayment,
                    p.acceptsCreditcardPayment
                   ];
      createOrUpdate = createOrUpdate
                          .then(function(){
                            return self.raw(query, data);
                          });
    })(products[i]);
  }
  return createOrUpdate;
};

Store.prototype._deleteProductsCoverage = function(userId) {
  return this
    .db('product_coverages')
    .whereRaw('product_id IN (SELECT id FROM products where user_id = (SELECT id FROM users WHERE client_id = ?))', [userId])
    .del();
};

Store.prototype.updateProductsCoverage = function(userId, products){
  var inserts = [];
  var self = this;
  for (var i = 0; i < products.length; i++) {
    var product = products[i];
    var productIdQuery = self.raw("(SELECT id FROM products WHERE client_id = ?)", [product.id]);
    inserts = inserts.concat(product.coverage.map(function(coverage){
      return {
        product_id: productIdQuery,
        coverage_radius: coverage.radius,
        coverage_lat: coverage.center.lat,
        coverage_lng: coverage.center.lng
      };
    }));
  }
  return this
    ._deleteProductsCoverage(userId)
    .then(function(){
      if(inserts.length > 0) {
        return self.db('product_coverages').insert(inserts);
      }
    })
};

Store.prototype.getUserById = function(id) {
  return this
    .db('users')
    .where('users.client_id', id)
    .select('users.*',
            'client_id as id',
            'full_name as name');
};

Store.prototype.getUserByToken = function(token) {
  return this
    .db('users')
    .where('token', token)
    .select('users.*',
            'client_id as id',
            'full_name as name');
};

Store.prototype.getAllUsers = function() {
  return this
    .db('users')
    .select('users.*',
            'client_id as id',
            'full_name as name');
};

Store.prototype.getProducts = function(userId) {
  return this
    .db('products')
    .whereRaw('user_id = (SELECT id from users where client_id = ?)', [userId])
    .select('products.*',
            'products.client_id as id',
            this.raw('(SELECT client_id FROM users WHERE id = products.user_id) as user_id'));
};

Store.prototype.getUserProductsCoverage = function(userId) {
  return this
    .db('product_coverages')
    .whereRaw("product_id IN (SELECT id FROM products WHERE user_id = (SELECT id FROM users WHERE client_id = ?))", [userId])
    .select('product_coverages.*',
            this.raw('(SELECT client_id FROM products WHERE id = product_coverages.product_id) as product_id'));
};

Store.prototype.raw = function(query, bindings) {
  return this.db.raw(query, bindings);
};

Store.prototype.clear = function() {

};

module.exports = new Store();