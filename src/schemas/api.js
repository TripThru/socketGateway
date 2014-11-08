var common = require('./common');

module.exports = {
    dispatchTripRequest: {
      "id": "http://www.tripthru.com/dispatch-trip-request",
      "$schema": "http://json-schema.org/draft-04/schema#",
      "description": "schema for a trip dispatch request",
      "type": "object",
      "properties": {
        "partner": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "fleet" : {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "driver" : {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "passenger" : {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "luggage": { "type": "integer" },
        "persons": { "type": "integer" },
        "pickupLocation": {
          "type": "object",
          "properties": {
            "lat": { "type": "number" },
            "lng": { "type": "number" }
          },
          "required": [ "lat", "lng" ]
        },
        "pickupTime": { "type": "string", "format": "date-time" },
        "dropoffLocation": {
          "type": "object",
          "properties": {
            "lat": { "type": "number" },
            "lng": { "type": "number" }
          },
          "required": [ "lat", "lng" ]
        },
        "dropoffTime": { "type": "string", "format": "date-time" },
        "paymentMethod": { "enum": common.paymentMethods },
        "vehicleType": { "enum": common.vehicleTypes },
        "maxPrice": { "type": "number", "minimum": 0 },
        "minRating": { "type": "number", "minimum": 0 },
        "id": { "type": "string" },
        "clientId": { "type": "string" }
      },
      "required": [ "passenger", "pickupLocation", "pickupTime", 
                    "dropoffLocation", "id" ]
    },
    quoteTripRequest: {
      "id": "http://www.tripthru.com/quote-request",
      "$schema": "http://json-schema.org/draft-04/schema#",
      "description": "schema for a quote request",
      "type": "object",
      "properties": {
        "partner": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "fleet" : {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "driver" : {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "passenger" : {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" }
          },
          "required": [ "id" ]
        },
        "luggage": { "type": "integer" },
        "persons": { "type": "integer" },
        "pickupLocation": {
          "type": "object",
          "properties": {
            "lat": { "type": "number" },
            "lng": { "type": "number" }
          },
          "required": [ "lat", "lng" ]
        },
        "pickupTime": { "type": "string", "format": "date-time" },
        "dropoffLocation": {
          "type": "object",
          "properties": {
            "lat": { "type": "number" },
            "lng": { "type": "number" }
          },
          "required": [ "lat", "lng" ]
        },
        "dropoffTime": { "type": "string", "format": "date-time" },
        "paymentMethod": { "enum": common.paymentMethods },
        "vehicleType": { "enum": common.vehicleTypes },
        "maxPrice": { "type": "number", "minimum": 0 },
        "eta": { "type": "string", "format": "date-time" },
        "id": { "type": "string" },
        "clientId": { "type": "string" }
      },
      "required": [ "pickupLocation", "pickupTime", "dropoffLocation", "id" ]
    }
}