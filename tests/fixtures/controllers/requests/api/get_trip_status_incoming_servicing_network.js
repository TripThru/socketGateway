var tripId = require('../../trip_id');
var servicingNetworkId = require('../../servicing_network').id;

module.exports = {
  id: tripId,
  client_id: servicingNetworkId
};