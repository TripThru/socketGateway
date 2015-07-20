module.exports = {
  id: 'test_trip_5',
  user: { id: 'testuser14@tripthru.com' },
  product: { id: 'Test product client id 1-testuser14@tripthru.com' },
  customer: {
    id: 'test customer id',
    name: 'test customer',
    localId: 'en_us',
    phoneNumber: '12341234'
  },
  pickupLocation: {
    lat: 123.5,
    lng: 312.4,
    description: 'pickup location description '
  },
  pickupTime: '2015-07-18T06:53:34-07:00',
  dropoffLocation: {
    lat: 456.7,
    lng: 654.3,
    description: 'dropoff location description '
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
  status: 'new',
  lastUpdate: '2015-07-18T06:42:34-07:00',
  autoDispatch: true,
  creation: '2015-07-18T06:38:34-07:00',
  servicingNetwork: { id: 'testuser15@tripthru.com' },
  servicingProduct: { id: 'Test product client id 1-testuser15@tripthru.com' },
  dropoffTime: '2015-07-18T07:03:34-07:00',
  fare: 10.5,
  latenessMilliseconds: 60000,
  samplingPercentage: 1,
  serviceLevel: 1,
  duration: 600,
  distance: 15,
  eta: '2015-07-18T06:46:34-07:00',
  passengers: 5,
  luggage: 2,
  paymentMethod: 'cash',
  guaranteedTip: { amount: 0.5, currencyCode: 'USD' }
};