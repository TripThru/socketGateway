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
      originatingFleet: trip.originatingFleet,
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
  if(trip.servicingFleet) t.servicingFleet = trip.servicingFleet;
  if(trip.fleet) t.fleet = trip.fleet;
  if(trip.driver) t.driver = trip.driver;
  if(trip.passenger) t.passenger = trip.passenger;
  if(trip.latenessMilliseconds >= 0) t.latenessMilliseconds = trip.latenessMilliseconds;
  if(trip.serviceLevel >= 0) t.serviceLevel = trip.serviceLevel;
  if(trip.duration >= 0) t.duration = trip.duration;
  if(trip.distance >= 0) t.distance = trip.distance;
  return t;
}

function toStoreTrip(apiTrip) {
  var trip = cloneTrip(apiTrip);
  trip.creation = trip.creation.toDate();
  trip.lastUpdate = trip.lastUpdate.toDate();
  trip.latenessMilliseconds = trip.latenessMilliseconds || 0;
  if(trip.eta) trip.eta = trip.eta.toDate();
  if(trip.dropoffTime) trip.dropoffTime = trip.dropoffTime.toDate();
  if(trip.pickupTime) trip.pickupTime = trip.pickupTime.toDate();
  trip.loc = locationIndexFromLocation(apiTrip.pickupLocation);
  trip.samplingPercentage = 1;
  trip.originatingPartnerId = trip.originatingPartner.id;
  trip.originatingFleetId = trip.originatingFleet.id;
  trip.servicingPartnerId = trip.servicingPartner ? trip.servicingPartner.id : null;
  trip.servicingFleetId = trip.servicingFleet ? trip.servicingFleet.id : null; 
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

function TripsModel() {
  
}

TripsModel.prototype.add = function(trip) {
  return store.createTrip(toStoreTrip(trip));
};

TripsModel.prototype.update = function(trip) {
  return store.updateTrip(toStoreTrip(trip));
};

TripsModel.prototype.getById = function(id) {
  return store
    .getTripBy({id: id})
    .then(function(res){
      return res.length > 0 ? toApiTrip(res[0].toObject()) : null;
    });
};

module.exports = new TripsModel();