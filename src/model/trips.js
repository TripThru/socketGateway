var store = require('../store/store');
var moment = require('moment');

function locationIndexFromLocation(location) {
  return {
    type: 'Point',
    coordinates: [location.lng, location.lat]
  };
}

function cloneTrip(trip) {
  var t = {
      id: trip.id,
      originatingPartner: trip.originatingPartner,
      pickupLocation: trip.pickupLocation,
      pickupTime: trip.pickupTime,
      dropoffLocation: trip.dropoffLocation,
      vehicleType: trip.vehicleType,
      status: trip.status,
      creation: trip.creation,
      lastUpdate: trip.lastUpdate,
      autoDispatch: trip.autoDispatch
  };
  if(trip.price) t.price = trip.price;
  if(trip.dropoffTime) t.dropoffTime = trip.dropoffTime;
  if(trip.eta) t.eta = trip.eta;
  if(trip.servicingPartner) t.servicingPartner = trip.servicingPartner;
  if(trip.fleet) t.fleet = trip.fleet;
  if(trip.driver) t.driver = trip.driver;
  if(trip.passenger) t.passenger = trip.passenger;
  return t;
}

function toStoreTrip(apiTrip) {
  var trip = cloneTrip(apiTrip);
  trip.creation = trip.creation.toDate();
  trip.lastUpdate = trip.lastUpdate.toDate();
  if(trip.eta) trip.eta = trip.eta.toDate();
  if(trip.dropoffTime) trip.dropoffTime = trip.dropoffTime.toDate();
  if(trip.pickupTime) { 
    trip.latenessMilliseconds = 
      moment.duration(trip.pickupTime.diff(trip.creation)).asMilliseconds();
    trip.pickupTime = trip.pickupTime.toDate();
  } else {
    trip.latenessMilliseconds = 0;
  }
  trip.loc = locationIndexFromLocation(apiTrip.pickupLocation);
  trip.samplingPercentage = 1;
  trip.originatingPartnerId = trip.originatingPartner.id;
  trip.servicingPartnerId = trip.servicingPartner ? trip.servicingPartner.id : null;
  
  return trip;
}

function toApiTrip(storeTrip) {
  var trip = cloneTrip(storeTrip);
  trip.creation = moment(trip.creation);
  trip.lastUpdate = moment(trip.lastUpdate);
  if(trip.pickupTime) trip.pickupTime = moment(trip.pickupTime);
  if(trip.eta) trip.eta = moment(trip.eta);
  if(trip.dropoffTime) trip.dropoffTime = moment(trip.dropoffTime);
  return trip;
}

var self = module.exports = {
  add: function(trip) {
    return store
      .createTrip(toStoreTrip(trip))
      .error(function(err){
        console.log('Error ocurred adding trip ' + err);
        throw new Error('Error ocurred adding trip ' + err);
      });
  },
  update: function(trip) {
    return store
      .updateTrip(toStoreTrip(trip))
      .error(function(err) {
        console.log('Error ocurred updating trip ' + err);
        throw new Error('Error ocurred updating trip ' + err);
      });
  },
  getById: function(tripId) {
    return store
      .getTripBy({id: tripId})
      .then(function(res){
        return res.length > 0 ? toApiTrip(res[0].toObject()) : null;
      })
      .error(function(err){
        console.log('Error ocurred getting trip ' + err);
        throw new Error('Error ocurred getting trip ' + err);
      });
  }
};