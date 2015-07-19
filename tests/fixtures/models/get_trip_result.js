var moment = require('moment');

module.exports = {
  id: 'test_trip_2',
  originatingNetwork: {
    id: 'testuser8@tripthru.com',
    name: 'Updated Test User 8'
  },
  originatingProduct: {
    id: 'Test product client id 1-testuser8@tripthru.com',
    name: 'Test product 1-testuser8@tripthru.com'
  },
  customer: {
    id: 'test customer id',
    name: 'test customer',
    localId: 'en_us',
    phoneNumber: '12341234'
  },
  driver: {
    id: 'test driver id',
    name: 'test driver',
    localId: 'en_uk',
    phoneNumber: '12355231',
    nativeLanguage: {
      id: 'en_uk'
    }
  },
  servicingNetwork: {
    id: 'testuser9@tripthru.com'
  },
  servicingProduct: {
    id: 'Test product client id 1-testuser9@tripthru.com'
  },
  pickupLocation: {
    lat: 123.5,
    lng: 312.4,
    description: 'pickup location description '
  },
  pickupTime: moment('2015-07-18T06:02:08-07:00'),
  dropoffLocation: {
    lat: 456.7,
    lng: 654.3,
    description: 'dropoff location description '
  },
  dropofftime: moment('2015-07-18T06:18:08-07:00'),
  fare: 13.8,
  status: 'accepted',
  last_Update: moment('2015-07-18T05:57:08-07:00'),
  autoDispatch: true,
  latenessMilliseconds: 60030,
  samplingPercentage: 1,
  serviceLevel: 2,
  duration: 610,
  distance: 35,
  creation: moment('2015-07-18T05:52:08-07:00'),
  eta: moment('2015-07-18T05:57:08-07:00'),
  passengers: 5,
  luggage: 2,
  guaranteedTip: {
    amount: 0.5,
    currencyCode: 'USD'
  },
  paymentMethod: 'cash'
};