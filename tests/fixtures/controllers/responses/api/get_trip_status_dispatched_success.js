var resultCodes = require('../../../../../src/codes').resultCodes;
var servicingNetwork = require('../../servicing_network');

module.exports = {
  result: 'OK',
  result_code: resultCodes.ok,
  status: 'accepted',
  eta: '2015-01-26T14:07:41+00:00',
  product: {
    id: servicingNetwork.products[0].id,
    name: servicingNetwork.products[0].name,
    image_url: servicingNetwork.products[0].imageUrl
  },
  driver: {
    id: 'Carol 948 id',
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