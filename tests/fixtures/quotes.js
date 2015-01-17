var basicQuoteRequest = {
  tripId: '123',
  partner: {
    id: '123',
    name: 'partner'
  },
  fleet: {
    id: '123',
    name: 'fleet'
  },
  driver: {
    id: '123',
    name: 'driver'
  },
  passenger: {
    id: '123',
    name: 'passenger'
  },
  pickupLocation: { lat: 212312, lng: 123123 },
  pickupTime: "2014-10-30T02:56:51+00:00",
  dropoffLocation: { lat: 123123, lng: 123123 },
  dropoffTime: "2014-10-30T02:56:51+00:00",
  luggage: 5,
  persons: 1,
  vehicleType: 'sedan',
  paymentMethod: 'cash',
  maxPrice: 10,
  eta: "2014-10-30T02:56:51+00:00"
}

module.exports = {
    basicQuote: {
      id: '123',
      state: 'new',
      request: basicQuoteRequest,
      receivedQuotes: [basicQuoteRequest],
      partnersThatServe: ['1234'],
      autoDispatch: false
    }
}

