var moment = require('moment');

module.exports = {
  id: 'originating_user@tripthru.com',
  name: 'Originating user',
  passwordHash: '',
  email: 'originating_user@testuser.com',
  token: 'tokenoriginatinguser',
  role: 'partner',
  endpointType: 'socket',
  callbackUrl: 'callback originating user',
  creation: moment('2015-07-18T06:43:33-07:00'),
  lastUpdate: moment('2015-07-18T06:45:33-07:00'),
  products: [
    {
      id: 'Originating network product id',
      name: 'Originating network product name',
      imageUrl: 'Image url originating network',
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