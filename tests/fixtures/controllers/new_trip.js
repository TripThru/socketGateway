var moment = require('moment');
var tripId = require('./trip_id');
var originatingNetwork = require('./originating_network');
var servicingNetwork = require('./servicing_network');

module.exports = {
  id: tripId,
  user: { id: originatingNetwork.id },
  product: { id: originatingNetwork.products[0].id },
  customer: {
    name: 'Russell',
    localId: 'en_us',
    phoneNumber: '12314532'
  },
  pickupLocation: {
    lat: 123.5,
    lng: 312.4,
    description: 'pickup location description '
  },
  pickupTime: moment('2015-07-18T06:53:34+00:00'),
  dropoffLocation: {
    lat: 456.7,
    lng: 654.3,
    description: 'dropoff location description '
  },
  status: 'new',
  autoDispatch: false,
  servicingNetwork: {
    id: servicingNetwork.id,
    name: servicingNetwork.name
  },
  servicingProduct: {
    id: servicingNetwork.products[0].id,
    name: servicingNetwork.products[0].name,
    imageUrl: servicingNetwork.products[0].imageUrl
  },
  passengers: 1,
  luggage: 0,
  paymentMethod: 'cash',
  guaranteedTip: { amount: 1.00, currencyCode: 'USD' }
};