module.exports = {
    
  basicTrip : {
    id: '123complete',
    originatingPartner: {
      id: 'partner123',
      name: 'partner'
    },
    pickupLocation: {
      lat : 42.342634,
      lng : -71.122545
    },
    pickupTime: "2014-10-30T02:56:51+00:00",
    dropoffLocation: {
      lat : 42.367561,
      lng : -71.129498
    },
    passenger: {
      id: '1234',
      name: 'test passenger'
    }
  },
  incompleteTrip: {
    id: '123incomplete'
  },
  correctDispatchRequest : {
    id: '123complete',
    // Socket.js appends clientId when receiving request, add it here in case
    // we test the controller directly
    clientId: 'originatingPartnerId', 
    partner: {
      id: 'servicingPartner123',
      name: 'servicingPartner'
    },
    pickupLocation: {
      lat : 42.342634,
      lng : -71.122545
    },
    pickupTime: "2014-10-30T02:56:51+00:00",
    dropoffLocation: {
      lat : 42.367561,
      lng : -71.129498
    },
    passenger: {
      id: '1234',
      name: 'test passenger'
    }
  },
  correctUpdateStatusRequest: {
      id: '123complete',
      clientId: 'originatingPartnerId', 
      status: 'dispatched',
      eta: '2014-11-10T00:00:00+00:00',
      driver: { 
        id: 'driver',
        name: 'driver',
        location: { lat: 23412.3312, lng: -12212.334 }
      }
  },
  correctGetStatusRequest: {
      id: '123complete',
      clientId: 'originatingPartnerId', 
  }

}