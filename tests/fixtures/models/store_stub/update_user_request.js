module.exports = {
  id: 'testuser3@tripthru.com',
  name: 'Updated Test User 3',
  passwordHash: '',
  email: 'testuser3@testuser.com',
  token: 'tokenuser3',
  role: 'partner',
  endpointType: 'socket',
  callbackUrl: 'Updated callback url user 3',
  creation: '2015-07-18T06:43:33-07:00',
  lastUpdate: '2015-07-18T06:45:33-07:00',
  products: [
    {
      id: 'Test product client id 1-testuser13@tripthru.com',
      name: 'Test product 1-testuser13@tripthru.com',
      imageUrl: 'Image url 1-testuser13@tripthru.com',
      capacity: 2000,
      acceptsPrescheduled: true,
      acceptsOndemand: true,
      acceptsCashPayment: true,
      acceptsAccountPayment: true,
      acceptsCreditcardPayment: true,
      coverage: [
        {
          radius: 50,
          center: {
            lat: 12.04,
            lng: 14.23
          }
        },
        {
          radius: 20,
          center: {
            lat: 123.04,
            lng: 14.23
          }
        },
        {
          radius: 40,
          center: {
            lat: 12.04,
            lng: 144.23
          }
        }
       ]
    },
    {
      id: 'Test product client id 2-testuser13@tripthru.com',
      name: 'Test product 2-testuser13@tripthru.com',
      imageUrl: 'Image url 2-testuser13@tripthru.com',
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