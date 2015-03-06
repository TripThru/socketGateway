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
          productId: user.productsById[apiTrip.originatingProduct.id].id,
          pickupLocation: apiTrip.pickupLocation,
          pickupTime: getISOStringFromMoment(apiTrip.pickupTime),
          dropoffLocation: apiTrip.dropoffLocation,
          status: apiTrip.status,
          creation: getISOStringFromMoment(apiTrip.creation),
          lastUpdate: getISOStringFromMoment(apiTrip.lastUpdate),
          autoDispatch: apiTrip.autoDispatch,
          vehicleId: 1,
          passengerName: apiTrip.passenger.name
      };
      if(apiTrip.price) t.price = apiTrip.price;
      if(apiTrip.dropoffTime) t.dropoffTime = getISOStringFromMoment(apiTrip.dropoffTime);
      if(apiTrip.eta) t.eta = getISOStringFromMoment(apiTrip.eta);
      if(apiTrip.latenessMilliseconds >= 0) t.latenessMilliseconds = apiTrip.latenessMilliseconds;
      if(apiTrip.samplingPercentage) t.samplingPercentage = apiTrip.samplingPercentage;
      if(apiTrip.serviceLevel >= 0) t.serviceLevel = apiTrip.serviceLevel;
      if(apiTrip.duration >= 0) t.duration = apiTrip.duration;
      if(apiTrip.distance >= 0) t.distance = apiTrip.distance;
      if(apiTrip.driver) { 
        t.driver = apiTrip.driver; 
        t.driver.name = apiTrip.driver.name;
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
          autoDispatch: storeTrip.autodispatch === "true"
      };
      if(storeTrip.price) t.price = storeTrip.price;
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