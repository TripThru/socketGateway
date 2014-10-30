var mongoose = require("mongoose");
var common = require("./common");

var quoteRequestSchema = {
  tripId: { type: String, trim: true, required: true },
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
  pickupLocation: { lat: Number, lng: Number },
  pickupTime: Date,
  dropoffLocation: { lat: Number, lng: Number },
  dropoffTime: Date,
  luggage: Number,
  persons: Number,
  vehicleType: { type: String, enum: common.vehicleTypes },
  paymentMethod: { type: String, enum: common.paymentMethods },
  maxPrice: { type: Number, min: 0 },
  eta: Date
}

var self = module.exports = {
    
    trip: new mongoose.Schema({
      id: { type: String, trim: true, required: true },
      originatingPartner: { 
        id: { type: String, trim: true },
        name: String
      },
      servicingPartner: { 
        id: { type: String, trim: true },
        name: String
      },
      fleet: { 
        id: { type: String, trim: true },
        name: String
      },
      driver: { 
        id: { type: String, trim: true },
        name: String,
        location: { lat: Number, lng: Number }
      },
      passenger: { 
        id: { type: String, trim: true },
        name: String
      },
      pickupLocation: { lat: Number, lng: Number },
      pickupTime: Date,
      dropoffLocation: { lat: Number, lng: Number },
      dropoffTime: Date,
      vehicleType: { type: String, enum: common.vehicleTypes },
      price: { type: Number, min: 0 },
      status: { type: String, enum: common.tripStatus },
      eta: Date,
      creation: Date,
      lastUpdate: Date,
      state: { type: String, enum: common.tripState },
      isDirty: Boolean,
      madeDirtyBy: Boolean
    }),
    quote: new mongoose.Schema({
      id: { type: String, trim: true, required: true },
      state: { type: String, enum: common.quoteState },
      request: quoteRequestSchema,
      receivedQuotes: [quoteRequestSchema],
      partnersThatServe: [{ type: String }],
      autoDispatch: Boolean
    }),
    user: new mongoose.Schema({
      id: Number,
      clientId: { type: String, trim: true },
      username: { type: String, trim: true },
      partnerName: { type: String, trim: true },
      email: { type: String, trim: true },
      pwdhash: String,
      salt: String,
      isAdmin: Boolean,
      token: String
    })
}