var store = require('../store/store');
var moment = require('moment');

function getISOStringFromMoment(moment) {
  return moment.format().toString();
}

function toStoreTripPayment(apiTripPayment) {
  var tp = {
    tripId: apiTripPayment.tripId,
    tripDbId: apiTripPayment.tripDbId,
    requestedAt: getISOStringFromMoment(apiTripPayment.requestedAt),
    amount: apiTripPayment.amount,
    currencyCode: apiTripPayment.currencyCode,
    confirmation: apiTripPayment.confirmation,
    tip: apiTripPayment.tip || 0
  };
  if(apiTripPayment.confirmedAt) {
    tp.confirmedAt = getISOStringFromMoment(apiTripPayment.confirmedAt);
  }
  return tp;
}

function toApiTripPayment(storeTripPayment) {
  var tp = {
    id: storeTripPayment.id,
    tripId: storeTripPayment.trip_client_id,
    tripDbId: storeTripPayment.trip_id,
    requestedAt: moment(storeTripPayment.requested_at),
    amount: storeTripPayment.amount,
    currencyCode: storeTripPayment.currency_code,
    confirmation: storeTripPayment.confirmation,
    tip: storeTripPayment.tip || 0
  };
  if(storeTripPayment.confirmed_at) {
    tp.confirmedAt = moment(storeTripPayment.confirmed_at); 
  }
  return tp;
}

function TripPaymentsModel() {
  
}

TripPaymentsModel.prototype.add = function(tripPayment) {
  var tp = toStoreTripPayment(tripPayment);
  return store.createTripPayment(tp)
    .then(function(result){
      tp.id = result.insertId;
      return tp;
    });
};

TripPaymentsModel.prototype.update = function(tripPayment) {
  return store.updateTripPayment(toStoreTripPayment(tripPayment));
};

TripPaymentsModel.prototype.getById = function(id) {
  return store
    .getTripPaymentById(id)
    .then(function(res){
      return res.length > 0 ? toApiTripPayment(res[0]) : null;
    });
};

TripPaymentsModel.prototype.getByTripId = function(id) {
  return store
    .getTripPaymentByTripId(id)
    .then(function(res){
      return res.length > 0 ? toApiTripPayment(res[0]) : null;
    });
};

module.exports = new TripPaymentsModel();