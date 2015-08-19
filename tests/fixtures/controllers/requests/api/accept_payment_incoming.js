var tripId = require('../../trip_id');
var originatingNetworkId = require('../../originating_network').id;

module.exports = {
  id: tripId,
  client_id: originatingNetworkId,
  tip: {
    amount: 1,
    currency_code: 'USD'
  },
  confirmation: true
};