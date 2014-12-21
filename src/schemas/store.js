var mongoose = require("mongoose");
var common = require("./common");

var location = {
    lat: Number,
    lng: Number
};

var coverage = {
  center: location,
  radius: Number
};

var quoteRequestSchema = {
  id: { type: String, trim: true, required: true },
  clientId: { type: String, trim: true, required: true },
  partner: {
    id: { type: String, trim: true },
    name: String
  },
  fleet: {
    id: { type: String, trim: true },
    name: String
  },
  driver: {
    id: { type: String, trim: true },
    name: String
  },
  passenger: {
    id: { type: String, trim: true },
    name: String
  },
  pickupLocation: location,
  pickupTime: Date,
  dropoffLocation: location,
  dropoffTime: Date,
  luggage: Number,
  persons: Number,
  vehicleType: { type: String, enum: common.vehicleTypes },
  paymentMethod: { type: String, enum: common.paymentMethods },
  maxPrice: { type: Number, min: 0 }
};

var quoteResponseSchema = {
    partner: {
      id: { type: String, trim: true },
      name: String
    },
    fleet: {
      id: { type: String, trim: true },
      name: String
    },
    driver: {
      id: { type: String, trim: true },
      name: String
    },
    passenger: {
      id: { type: String, trim: true },
      name: String
    },
    eta: Date,
    vehicleType: { type: String, enum: common.vehicleTypes },
    price: Number,
    distance: Number,
    duration: Number
  };

var trip = new mongoose.Schema({
  id: { type: String, trim: true, required: true },
  originatingPartner: { 
    id: { type: String, trim: true },
    name: String
  },
  originatingPartnerId: String,
  servicingPartner: { 
    id: { type: String, trim: true },
    name: String
  },
  servicingPartnerId: String,
  fleet: { 
    id: { type: String, trim: true },
    name: String
  },
  driver: { 
    id: { type: String, trim: true },
    name: String,
    location: location,
    initialLocation: location,
    enrouteLocation: location,
    pickupLocation: location
  },
  passenger: { 
    id: { type: String, trim: true },
    name: String
  },
  pickupLocation: location,
  pickupTime: Date,
  dropoffLocation: location,
  dropoffTime: Date,
  vehicleType: { type: String, enum: common.vehicleTypes },
  price: { type: Number, min: 0 },
  status: { type: String, enum: common.tripStatus },
  creation: Date,
  lastUpdate: Date,
  state: { type: String, enum: common.tripState },
  autoDispatch: Boolean,
  loc: {
    type: {type: String},
    coordinates: []
  },
  latenessMilliseconds: Number,
  samplingPercentage: Number
});

var quote = new mongoose.Schema({
  id: { type: String, trim: true, required: true },
  state: { type: String, enum: common.quoteState },
  request: quoteRequestSchema,
  receivedQuotes: [quoteResponseSchema],
  partnersThatServe: [{ type: String }],
  autoDispatch: Boolean
});

var user = new mongoose.Schema({
  id: { type: String, trim: true },
  username: { type: String, trim: true },
  partnerName: { type: String, trim: true },
  email: { type: String, trim: true },
  pwdhash: String,
  salt: String,
  isAdmin: Boolean,
  token: String,
  coverage: [coverage],
  fleets: [{ 
    id: { type: String, trim: true },
    name: String
  }],
  vehicleTypes: [{ type: String, enum: common.vehicleTypes }]
});

module.exports = {
  trip: trip,
  quote: quote,
  user: user
};