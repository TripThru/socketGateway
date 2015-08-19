var tripId = require('../trip_id');
var servicingNetwork = require('../servicing_network');

module.exports = {
    id: tripId,
    eta: '2015-07-20T01:02:58+00:00',
    network: {
      id: servicingNetwork.id,
      name: servicingNetwork.name
    },
    product: {
      id: servicingNetwork.products[0].id,
      name: servicingNetwork.products[0].name,
      image_url: servicingNetwork.products[0].imageUrl
    },
    fare: {
      low_estimate: 5,
      estimate: 12.5,
      high_estimate: 15,
      currency_code: 'USD'
    },
    distance: 0.425017895328,
    duration: 300
};