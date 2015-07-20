var store = require('../store/store');
var moment = require('moment');
var Promise = require('bluebird');

function getISOStringFromMoment(moment) {
  return moment.format().toString();
}

function toStoreTrip(apiTrip) {
  var t = {
    id: apiTrip.id,
    user: {
      id: apiTrip.user.id
    },
    product: {
      id: apiTrip.product.id
    },
    servicingNetwork: {
      id: apiTrip.servicingNetwork ? apiTrip.servicingNetwork.id : null
    },
    servicingProduct: {
      id: apiTrip.servicingProduct ? apiTrip.servicingProduct.id : null
    },
    pickupLocation: apiTrip.pickupLocation,
    pickupTime: getISOStringFromMoment(apiTrip.pickupTime),
    dropoffLocation: apiTrip.dropoffLocation,
    status: apiTrip.status,
    creation: getISOStringFromMoment(apiTrip.creation),
    lastUpdate: getISOStringFromMoment(apiTrip.lastUpdate),
    autoDispatch: apiTrip.autoDispatch,
    paymentMethod: apiTrip.paymentMethod,
    guaranteedTip: apiTrip.guaranteedTip
  };
  if(apiTrip.fare) t.fare = apiTrip.fare;
  if(apiTrip.dropoffTime) t.dropoffTime = getISOStringFromMoment(apiTrip.dropoffTime);
  if(apiTrip.eta) t.eta = getISOStringFromMoment(apiTrip.eta);
  if(apiTrip.latenessMilliseconds >= 0) t.latenessMilliseconds = apiTrip.latenessMilliseconds;
  if(apiTrip.samplingPercentage) t.samplingPercentage = apiTrip.samplingPercentage;
  if(apiTrip.serviceLevel >= 0) t.serviceLevel = apiTrip.serviceLevel;
  if(apiTrip.duration >= 0) t.duration = apiTrip.duration;
  if(apiTrip.distance >= 0) t.distance = apiTrip.distance;
  if(apiTrip.passengers >= 0) t.passengers = apiTrip.passengers;
  if(apiTrip.luggage >= 0) t.luggage = apiTrip.luggage;
  if(apiTrip.customer) {
    t.customer = {
      id: apiTrip.customer.id,
      name: apiTrip.customer.name,
      localId: apiTrip.customer.localId,
      phoneNumber: apiTrip.customer.phoneNumber
    };
  }
  if(apiTrip.driver) {
    t.driver = {
      id: apiTrip.driver.id,
      name: apiTrip.driver.name,
      localId: apiTrip.driver.localId,
      phoneNumber: apiTrip.driver.phoneNumber,
      nativeLanguage: {
        id: apiTrip.driver.nativeLanguage.id
      }
    };
    if(apiTrip.driver.location){
      t.driver.location = {
        lat: apiTrip.driver.location.lat,
        lng: apiTrip.driver.location.lng,
        description: apiTrip.driver.location.description,
        datetime: getISOStringFromMoment(apiTrip.driver.location.datetime)
      }
    }
  }

  return t;
}

function toApiTrip(storeTrip) {
  var t = {
      id: storeTrip.id,
      originatingNetwork: {
        id: storeTrip.user_id,
        name: storeTrip.user_name
      },
      originatingProduct: {
        id: storeTrip.product_id,
        name: storeTrip.product_name
      },
      pickupLocation: {
        lat: storeTrip.pickup_location_lat,
        lng: storeTrip.pickup_location_lng,
        description: storeTrip.pickup_location_description
      },
      pickupTime: moment(storeTrip.pickup_time),
      dropoffLocation: {
        lat: storeTrip.dropoff_location_lat,
        lng: storeTrip.dropoff_location_lng,
        description: storeTrip.dropoff_location_description
      },
      status: storeTrip.status,
      creation: moment(storeTrip.created_at),
      lastUpdate: moment(storeTrip.last_update),
      autoDispatch: storeTrip.autodispatch === 1,
      paymentMethod: storeTrip.payment_method,
      fare: storeTrip.fare,
      latenessMilliseconds: storeTrip.lateness_milliseconds,
      samplingPercentage: storeTrip.sampling_percentage,
      serviceLevel: storeTrip.service_level,
      duration: storeTrip.duration_seconds,
      distance: storeTrip.distance,
      passengers: storeTrip.passengers,
      luggage: storeTrip.luggage
  };
  if(storeTrip.servicing_network_id) {
    t.servicingNetwork = {
      id: storeTrip.servicing_network_id
    };
  }
  if(storeTrip.servicing_product_id) {
    t.servicingProduct = {
      id: storeTrip.servicing_product_id
    };
  }
  if(storeTrip.guaranteed_tip_amount) {
    t.guaranteedTip = {
      amount: storeTrip.guaranteed_tip_amount,
      currencyCode: storeTrip.guaranteed_tip_currency_code
    };
  }
  if(storeTrip.customer_name) {
    t.customer = {
      id: storeTrip.customer_id,
      name: storeTrip.customer_name,
      localId: storeTrip.customer_local_id,
      phoneNumber: storeTrip.customer_phone_number
    };
  }
  if(storeTrip.driver_name) {
    t.driver = {
      id: storeTrip.driver_id,
      name: storeTrip.driver_name,
      localId: storeTrip.driver_local_id,
      phoneNumber: storeTrip.driver_phone_number,
      nativeLanguage: {
        id: storeTrip.driver_native_language_id
      }
    };
  }
  if(storeTrip.dropoff_time) t.dropoffTime = moment(storeTrip.dropoff_time);
  if(storeTrip.eta) t.eta = moment(storeTrip.eta);

  return t;
}

function TripsModel() {

}

TripsModel.prototype.create = function(trip) {
  return store.createTrip(toStoreTrip(trip));
};

TripsModel.prototype.update = function(trip) {
  var storeTrip = toStoreTrip(trip);
  var update = [store.updateTrip(storeTrip)];
  if(trip.driver && trip.driver.location) {
    update.push(store.createTripLocation(storeTrip.id, storeTrip.driver.location));
  }
  return Promise.all(update);
};

TripsModel.prototype.getById = function(id) {
  return store
    .getTripById(id)
    .then(function(res){
      return res.length > 0 ? toApiTrip(res[0]) : null;
    });
};

module.exports = new TripsModel();