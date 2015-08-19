var tripId = require('../../trip_id');
var originatingNetwork = require('../../originating_network');

module.exports = {
  id: tripId,
  client_id: originatingNetwork.id,
  status: 'cancelled'
};