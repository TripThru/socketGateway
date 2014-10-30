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
  pickupTime: new Date(),
  dropoffLocation: { lat: 123123, lng: 123123 },
  dropoffTime: new Date(),
  luggage: 5,
  persons: 1,
  vehicleType: 'sedan',
  paymentMethod: 'cash',
  maxPrice: 10,
  eta: new Date()
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

