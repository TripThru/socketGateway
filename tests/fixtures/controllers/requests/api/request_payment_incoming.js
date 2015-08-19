var tripId = require('../../trip_id');
var servicingNetworkId = require('../../servicing_network').id;

module.exports = {
  id: tripId,
  currency_code: 'USD',
  fare: 9.50,
  client_id: servicingNetworkId
};