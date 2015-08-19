var tripId = require('../../trip_id');
var originatingNetworkId = require('../../originating_network').id;
var servicingNetwork = require('../../servicing_network');

module.exports = {
  id: tripId,
  client_id: originatingNetworkId,
  network_id: servicingNetwork.id,
  product_id: servicingNetwork.products[0].id,
  customer: {
    id: 'Russell id',
    name: 'Russell',
    local_id: 'en_us',
    phone_number: '12314532'
  },
  pickup_location: {
    lat: -0.188385,
    lng: -78.497597
  },
  pickup_time: '2015-07-20T01:02:58+00:00',
  dropoff_location: {
    lat: -0.189093,
    lng: -78.502135
  },
  passengers: 1,
  luggage: 0,
  payment_method_code: 'cash',
  tip: {
    amount: 1.00,
    currency_code: 'USD'
  }
};