var store = require('../store/store');
var users = require('../controller/users');
var moment = require('moment');

function getISOStringFromMoment(moment) {
  return moment.format().toString();
}

function toStoreTrip(apiTrip) {
  return users
    .getByClientId(apiTrip.originatingNetwork.id)
    .then(function(user){
      var t = {
          id: apiTrip.id,
          dbId: apiTrip.dbId,
          userId: user.id,
          //productId: user.productsById[apiTrip.originatingProduct.id].id,
          pickupLocation: apiTrip.pickupLocation,
          pickupTime: getISOStringFromMoment(apiTrip.pickupTime),
          dropoffLocation: apiTrip.dropoffLocation,
          status: apiTrip.status,
          creation: getISOStringFromMoment(apiTrip.creation),
          lastUpdate: getISOStringFromMoment(apiTrip.lastUpdate),
          autoDispatch: apiTrip.autoDispatch,
          paymentMethod: apiTrip.paymentMethod
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
      if(apiTrip.luggage >= 0) t.passengers = apiTrip.luggage;
      if(apiTrip.customer) {
        t.customer = {};
        t.customer.id = apiTrip.customer.id;
        t.customer.name = apiTrip.customer.name;
        t.customer.localId = apiTrip.customer.localId;
        t.customer.phoneNumber = apiTrip.customer.phoneNumber;
      }
      if(apiTrip.driver) { 
        t.driver = {}; 
        t.driver.id = apiTrip.driver.id;
        t.driver.name = apiTrip.driver.name;
        t.driver.localId = apiTrip.driver.localId;
        t.driver.nativeLanguageId = apiTrip.driver.nativeLanguageId;
        t.driver.location = apiTrip.driver.location;
      }
      if(apiTrip.servicingNetwork && apiTrip.servicingNetwork.id) {
        return users
          .getByClientId(apiTrip.servicingNetwork.id)
          .then(function(user) {
            t.servicingNetworkId = user.id;
            if(apiTrip.servicingProduct) {
              t.servicingProductId = user.productsById[apiTrip.servicingProduct.id].client_id;
            }
            return t;
          });
      } else {
        return t;
      }
      //TODO: Transform all fields
      /*
      if(storeTrip.product) t.product = storeTrip.product;
      if(storeTrip.passenger) t.passenger = storeTrip.passenger;
      */
    });
}

function toApiTrip(storeTrip) {
  return users
    .getByClientId(storeTrip.user_client_id)
    .then(function(user){
      var t = {
          id: storeTrip.trip_id,
          dbId: storeTrip.id,
          originatingNetwork: { 
            id: storeTrip.user_client_id, 
            name: storeTrip.user_name
          },
          originatingProduct: {
            id: storeTrip.product_client_id,
            name: storeTrip.product_name
          },
          pickupLocation: {
            lat: storeTrip.pickup_location_lat,
            lng: storeTrip.pickup_location_lng
          },
          pickupTime: moment(storeTrip.pickup_time),
          dropoffLocation: {
            lat: storeTrip.dropoff_location_lat,
            lng: storeTrip.dropoff_location_lng
          },
          status: storeTrip.status,
          creation: moment(storeTrip.created_at),
          lastUpdate: moment(storeTrip.last_update),
          autoDispatch: storeTrip.autodispatch === "true",
          paymentMethod: storeTrip.payment_method
      };
      if(storeTrip.guaranteed_tip_amount) {
        t.guaranteedTip = {
          amount: storeTrip.guaranteed_tip_amount,
          currencyCode: storeTrip.guaranteed_tip_currency_code
        };
      }
      if(storeTrip.customer_name) {
        t.customer = {};
        t.customer.id = storeTrip.customer_id;
        t.customer.name = storeTrip.customer_name;
        t.customer.localId = storeTrip.customer_local_id;
        t.customer.phoneNumber = storeTrip.customer_phone_number;
      }
      if(storeTrip.driver_name) { 
        t.driver = {}; 
        t.driver.id = storeTrip.driver_id;
        t.driver.name = storeTrip.driver_name;
        t.driver.localId = storeTrip.driver_local_id;
        t.driver.nativeLanguageId = storeTrip.driver_native_language_id;
      }
      if(storeTrip.passengers) t.passengers = storeTrip.passengers;
      if(storeTrip.luggage) t.luggage = storeTrip.luggage;
      if(storeTrip.fare) t.fare = storeTrip.fare;
      if(storeTrip.dropoff_time) t.dropoffTime = moment(storeTrip.dropoff_time);
      if(storeTrip.eta) t.eta = moment(storeTrip.eta);
      
      //TODO: Transform all fields
      /*
      if(storeTrip.servicingNetwork) t.servicingNetwork = storeTrip.servicingNetwork;
      if(storeTrip.servicingProduct) t.servicingProduct = storeTrip.servicingProduct;
      if(storeTrip.product) t.product = storeTrip.product;
      if(storeTrip.driver) t.driver = storeTrip.driver;
      if(storeTrip.passenger) t.passenger = storeTrip.passenger;
      if(storeTrip.latenessMilliseconds >= 0) t.latenessMilliseconds = storeTrip.latenessMilliseconds;
      if(storeTrip.serviceLevel >= 0) t.serviceLevel = storeTrip.serviceLevel;
      if(storeTrip.duration >= 0) t.duration = storeTrip.duration;
      if(storeTrip.distance >= 0) t.distance = storeTrip.distance;
      */
      return t;
    });
}

function TripsModel() {
  
}

TripsModel.prototype.add = function(trip) {
  return toStoreTrip(trip)
    .bind({})
    .then(function(t){ 
      this.t = t;
      return store.createTrip(t);
    })
    .then(function(result){
      this.t.dbId = result.insertId;
      return this.t;
    });
};

TripsModel.prototype.update = function(trip) {
  return toStoreTrip(trip)
    .then(function(t){
      return store.updateTrip(t);
    });
};

TripsModel.prototype.getById = function(id) {
  return store
    .getTripById(id)
    .then(function(res){
      return res.length > 0 ? toApiTrip(res[0]) : null;
    });
};

module.exports = new TripsModel();