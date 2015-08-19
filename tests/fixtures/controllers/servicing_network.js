var moment = require('moment');

module.exports = {
  id: 'servicing_user@tripthru.com',
  name: 'servicing user',
  passwordHash: '',
  email: 'servicing_user@testuser.com',
  token: 'tokenservicinguser',
  role: 'partner',
  endpointType: 'socket',
  callbackUrl: 'callback servicing user',
  creation: moment('2015-07-18T06:43:33-07:00'),
  lastUpdate: moment('2015-07-18T06:45:33-07:00'),
  products: [
    {
      id: 'servicing network product id',
      name: 'servicing network product name',
      imageUrl: 'Image url servicing network',
      capacity: 1500,
      acceptsPrescheduled: true,
      acceptsOndemand: false,
      acceptsCashPayment: true,
      acceptsAccountPayment: false,
      acceptsCreditcardPayment: true,
      coverage: [
        {
          radius: 30,
          center: {
            lat: 102.04,
            lng: 122.23
          }
        }
     ]
    }
  ]
};