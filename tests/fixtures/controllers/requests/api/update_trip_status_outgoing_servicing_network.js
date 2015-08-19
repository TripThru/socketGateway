var tripId = require('../../trip_id');
var servicingNetwork = require('../../servicing_network');

module.exports = {
  id: tripId,
  status: 'accepted',
  product: {
    id: servicingNetwork.products[0].id,
    name: servicingNetwork.products[0].name,
    image_url: servicingNetwork.products[0].imageUrl
  },
  fare: {
    amount: 10.5,
    currency_ccode: 'USD'
  },
  eta: '2015-07-20T01:02:58+00:00',
  driver: {
    name: 'Carol 948',
    local_id: 'en_us',
    native_languague_id: 'en_us',
    location: {
      lat: -0.19,
      lng: -78.5,
      description: 'Carol location'
    }
  }
};