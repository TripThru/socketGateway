var store = require('../store/store');
var moment = require('moment');

function getISOStringFromMoment(moment) {
  return moment.format().toString();
}

function toStoreTripPayment(apiTripPayment) {
  var tp = {
    trip: {
      id: apiTripPayment.trip.id
    },
    requestedAt: getISOStringFromMoment(apiTripPayment.requestedAt),
    amount: apiTripPayment.amount,
    currencyCode: apiTripPayment.currencyCode,
    confirmed: apiTripPayment.confirmed,
    tip: apiTripPayment.tip
  };
  if(apiTripPayment.confirmedAt) {
    tp.confirmedAt = getISOStringFromMoment(apiTripPayment.confirmedAt);
  }
  return tp;
}

function toApiTripPayment(storeTripPayment) {
  var tp = {
    trip: {
      id: storeTripPayment.trip_id
    },
    requestedAt: moment(storeTripPayment.requested_at),
    amount: storeTripPayment.amount,
    currencyCode: storeTripPayment.currency_code,
    confirmed: storeTripPayment.confirmed === 1
  };
  if(storeTripPayment.tip) {
    tp.tip = {
      amount: storeTripPayment.tip,
      currencyCode: storeTripPayment.tip_currency_code
    };
  }
  if(storeTripPayment.confirmed_at) {
    tp.confirmedAt = moment(storeTripPayment.confirmed_at);
  }
  return tp;
}

function TripPaymentsModel() {

}

TripPaymentsModel.prototype.create = function(tripPayment) {
  return store.createTripPayment(toStoreTripPayment(tripPayment));
};

TripPaymentsModel.prototype.update = function(tripPayment) {
  return store.updateTripPayment(toStoreTripPayment(tripPayment));
};

TripPaymentsModel.prototype.getByTripId = function(id) {
  return store
    .getTripPaymentByTripId(id)
    .then(function(res){
      return res.length > 0 ? toApiTripPayment(res[0]) : null;
    });
};

module.exports = new TripPaymentsModel();