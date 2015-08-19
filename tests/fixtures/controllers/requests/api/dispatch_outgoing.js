var tripId = require('../../trip_id');
var servicingNetwork = require('../../servicing_network');

module.exports = {
  id: tripId,
  network_id: servicingNetwork.id,
  product_id: servicingNetwork.products[0].id,
  pickup_location: {
    lat: -0.188385,
    lng: -78.497597
  },
  pickup_time: '2015-07-20T01:02:58+00:00',
  dropoff_location: {
    lat: -0.189093,
    lng: -78.502135
  },
  payment_method_code: 'cash',
  customer: {
    name: 'Russell',
    local_id: 'en_us',
    phone_number: '12314532'
  },
  tip: {
    amount: 1.00,
    currency_code: 'USD'
  }
};