var tripId = require('../../trip_id');
var originatingNetworkId = require('../../originating_network').id;

module.exports = {
  id: tripId,
  client_id: originatingNetworkId,
  customer: {
    id: 'Russell id',
    name: 'Russell',
    local_id: 'en_us',
    phone_number: '12314532'
  },
  pickup_location: {
    lat: 123.5,
    lng: 312.4,
    description: 'pickup location description '
  },
  pickup_time: '2015-07-18T06:53:34-07:00',
  dropoff_location: {
    lat: 456.7,
    lng: 654.3,
    description: 'dropoff location description '
  },
  passengers: 1,
  luggage: 0,
  payment_method_code: 'cash',
  tip: {
    amount: 1.00,
    currency_code: 'USD'
  }
};