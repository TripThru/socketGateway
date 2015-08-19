var moment = require('moment');
var tripPaymentsModel = require('./model/trip_payments');
var Promise = require('bluebird');
var RedisClient = require("./store/redis_client");

function ActiveTripPayments() {
  this.redisClient = new RedisClient('tripPayments');
}

ActiveTripPayments.prototype.create = function(tripPayment) {
  return Promise.all([
      tripPaymentsModel.create(tripPayment),
      this.redisClient.add(tripPayment.trip.id, tripPayment)
    ]);
};

ActiveTripPayments.prototype.update = function(tripPayment) {
  return this
    .redisClient
    .update(tripPayment.trip.id, tripPayment)
    .bind(this)
    .then(function(reply){
      tripPaymentsModel.update(tripPayment);
      if(tripPayment.confirmation) {
        this.deactivate(tripPayment);
      }
    });
};

ActiveTripPayments.prototype.deactivate = function(tripPayment) {
  this.redisClient.del(tripPayment.trip.id);
};

ActiveTripPayments.prototype.getByTripId = function(id) {
  return this
    .redisClient
    .get(id)
    .then(function(tripPayment){
      if(tripPayment) {
        tripPayment = toApiTripPayment(tripPayment);
      }
      return tripPayment;
    });
};

ActiveTripPayments.prototype.clear = function() {
  this.redisClient.clear();
};

var toApiTripPayment = function(redisTripPayment) {
  redisTripPayment.requestedAt = moment(redisTripPayment.requestedAt);
  if(redisTripPayment.confirmedAt) {
    redisTripPayment.confirmedAt = moment(redisTripPayment.confirmedAt);
  }
  return redisTripPayment;
};

module.exports = new ActiveTripPayments();