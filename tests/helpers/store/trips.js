var moment = require('moment');
var tripId = 0;

function Trip(user, product, servicingUser, servicingProduct) {
  tripId++;
  this.id = 'test_trip_' + tripId;
  this.user = {
    id: user.id
  };
  this.product = {
    id: product.id
  };
  this.customer = {
    id: 'test customer id',
    name: 'test customer',
    localId: 'en_us',
    phoneNumber: '12341234'
  };
  this.pickupLocation = {
    lat: 123.5,
    lng: 312.4,
    description: 'pickup location description '
  };
  this.pickupTime = moment().add(10, 'minutes').format().toString();
  this.dropoffLocation = {
    lat: 456.7,
    lng: 654.3,
    description: 'dropoff location description '
  };
  this.driver = {
    id: null,
    name: null,
    localId: null,
    phoneNumber: null,
    nativeLanguage: {
      id: null
    }
  };
  this.status = 'new';
  this.lastUpdate = moment().subtract(1, 'minutes').format().toString();
  this.autoDispatch = true;
  this.creation = moment().subtract(5, 'minutes').format().toString();
  this.servicingNetwork = {
    id: servicingUser.id
  };
  this.servicingProduct = {
    id: servicingProduct.id
  };
  this.dropoffTime = moment().add(20, 'minutes').format().toString();
  this.fare = 10.50;
  this.latenessMilliseconds = 60000;
  this.samplingPercentage = 1;
  this.serviceLevel = 1;
  this.duration = 600;
  this.distance = 15;
  this.eta = moment().add(3, 'minutes').format().toString();
  this.passengers = 5;
  this.luggage = 2;
  this.paymentMethod = 'cash';
  this.guaranteedTip = {
    amount: 0.50,
    currencyCode: 'USD'
  };
  this.locationUpdates = [];
}

Trip.prototype.update = function() {
  this.status = 'accepted';
  this.lastUpdate = moment().format().toString();
  this.pickupTime = moment(this.pickupTime).subtract(5, 'minutes').format().toString();
  this.latenessMilliseconds = this.latenessMilliseconds + 30;
  this.serviceLevel = this.serviceLevel + 1;
  this.duration = this.duration + 10;
  this.distance = this.distance + 20;
  this.eta = moment(this.eta).subtract(3, 'minutes').format().toString();
  this.dropoffTime = moment(this.dropoffTime).add(1, 'minutes').format().toString();
  this.fare = this.fare + 3.30;
  this.driver = {
    id: 'test driver id',
    name: 'test driver',
    localId: 'en_uk',
    phoneNumber: '12355231',
    nativeLanguage: {
      id: 'en_uk'
    }
  };
};

Trip.prototype.updateDriverLocation = function() {
  if(this.locationUpdates.length === 0) {
    this.driver.location = {
      lat: 123.123,
      lng: 102.232,
      description: 'test_location ' + this.locationUpdates.length +  ' driver ' + this.id,
      datetime: moment().format().toString()
    };
  } else {
    this.driver.location.lat = this.driver.location.lat + 0.5;
    this.driver.location.lng = this.driver.location.lng - 0.5;
    this.driver.location.description = 'test_location ' + this.locationUpdates.length +  ' driver ' + this.id;
    this.driver.location.datetime = moment().format().toString();
  }
  this.locationUpdates.push({
    lat: this.driver.location.lat,
    lng: this.driver.location.lng,
    description: this.driver.location.description,
    datetime: this.driver.location.datetime
  });
};

Trip.prototype.getPaymentRequest = function() {
  this.payment = {
    trip: {
     id: this.id
    },
    requestedAt: moment().format().toString(),
    amount: 15.50,
    currencyCode: 'USD',
    confirmed: false,
    confirmedAt: null,
    tip: 0
  };
  return this.payment;
};

Trip.prototype.getConfirmedPaymentRequest = function() {
  this.payment.tip = 1.40;
  this.payment.confirmed = true;
  this.payment.confirmedAt = moment().format().toString();
  return this.payment;
}

module.exports = Trip;