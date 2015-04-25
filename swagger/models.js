var schemas = require('../src/schemas/api');

var paymentMethods = schemas.paymentMethods;
var tripStatus =  schemas.tripStatus;

module.exports.models = {
    "Location": {
      "description": "Latitude and longitude of a location",
      "properties": {
        "lat": {
          "type": "number"
        },
        "lng": {
          "type": "number"
        },
        "description": {
          "description": "Brief description of the location, could be directions.",
          "type": "string"
        }
      },
      "required": ["lat", "lng"]
    },
    "Zone": {
      "description": "Service coverage zone",
      "properties": {
        "center": {
          "$ref": "Location"
        },
        "radius": {
          "description": "Coverage radius",
          "type": "integer"
        }
     },
     "required": ["center", "radius"]
    },
    "Product" : {
      "id": "Product",
      "properties": {
        "id": {
          "description": "Product's identifier",
          "type": "string"
        },
        "name": {
          "description": "Product's name",
          "type": "string"
        },
        "image_url": {
          "description": "Product's image url",
          "type": "string"
        },
        "capacity": {
          "description": "Product's traffic capacity",
          "type": "integer"
        },
        "accepts_prescheduled": {
          "description": "Accepts prescheduled trips",
          "type": "boolean"
        },
        "accepts_ondemand": {
          "description": "Accepts ondemand trips",
          "type": "boolean"
        },
        "accepts_cash_payment": {
          "description": "Accepts cash payments",
          "type": "boolean"
        },
        "accepts_account_payment": {
          "description": "Accepts account payments",
          "type": "boolean"
        },
        "accepts_creditcard_payment": {
          "description": "Accepts credit card payments",
          "type": "boolean"
        },
        "coverage": {
          "$ref": "Zone"
        }
      },
      "required": [
        "id",
        "name",
        "image_url"
       ],
    },
    "Set Network Info": {
      "id":"Set Network Info",
      "properties": {
        "id": {
          "description": "Networks's identifier",
          "type": "string"
        },
        "name": {
          "description": "Network's name",
          "type": "string"
        },
        "callback_url": {
          "description": "Webhook for restful endpoint",
          "type": "string"
        },
        "products": {
          "description": "An array containing the network's products",
          "type": "array",
          "items": {
            "$ref": "Product"
          }
        }
      },
      "required": [
        "id",
        "name",
        "products"
      ]
    },
    "Get Network Info": {
      "id": "Get Network Info",
      "properties": {
        "id": {
          "description": "Product's identifier",
          "type": "string"
        },
      },
      "required": [
        "id"
      ]
    },
    "Customer": {
      "id": "Customer",
      "properties": {
        "id": {
          "description": "Customer's unique identifier",
          "type": "string"
        },
        "name": {
          "description": "Customer's first name",
          "type": "string"
        },
        "local_id": {
          "description": "Local language id",
          "type": "string"
        },
        "phone_number": {
          "description": "Customer's phone number",
          "type": "string"
        }
      },
      "required": [
        "name"
      ]
    },
    "Tip": {
      "id": "Tip",
      "properties": {
        "amount": {
          "id": "http://www.tripthru.com/dispatch/tip/amount",
          "type": "number"
        },
        "currency_code": {
          "id": "http://www.tripthru.com/dispatch/tip/currency_code",
          "type": "string"
        }
      },
      "required": [
        "amount",
        "currency_code"
      ]
    },
    "Dispatch": {
      "Dispatch": "Dispatch",
      "properties": {
        "id": {
          "description": "Trip identifier",
          "type": "string"
        },
        "customer": {
          "$ref": "Customer"
        },
        "passengers": {
          "description": "Number of passengers",
          "type": "integer"
        },
        "luggage": {
          "description": "Luggage quantity",
          "type": "integer"
        },
        "quote_id": {
          "description": "Quote identifier",
          "type": "string"
        },
        "network_id": {
          "description": "Dispatch to a specific network",
          "type": "string"
        },
        "product_id": {
          "description": "Dispatch to a specific product",
          "type": "string"
        },
        "pickup_time": {
          "description": "Pickup time timestamp",
          "type": "timestamp"
        },
        "pickup_location": {
          "$ref": "Location"
        },
        "dropoff_location": {
          "$ref": "Location"
        },
        "payment_method_code": {
          "description": "Desired payment method",
          "type": "string",
          "enum": paymentMethods
        },
        "tip": {
          "$ref": "Tip"
        }
      },
      "required": [
        "id",
        "customer",
        "passengers",
        "luggage",
        "pickup_time",
        "pickup_location",
        "dropoff_location",
        "payment_method_code"
      ]
    },
    "Get Trip Status": {
      "id": "Get Trip Status",
      "properties": {
        "id": {
          "description": "Trip's identifier",
          "type": "string"
        }
      },
      "required": [
       "id"
     ]
    },
    "Update Trip Status Product": {
      "id": "Update Trip Status Product",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "image_url": {
          "type": "string"
        }
      },
      "required":[
        "id",
        "name",
        "image_url"
      ]
    },
    "Update Trip Status Driver": {
      "id": "Update Trip Status Driver",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "local_id": {
          "type": "string"
        },
        "native_language_id": {
          "type": "string"
        },
        "location": {
          "$ref": "Location"
        }
      },
      "required": [
        "name",
        "location"
      ]
    },
    "Update Trip Status": {
      "id": "Update Trip Status",
      "properties": {
        "id": {
          "description": "Trip's identifier",
          "type": "string"
        },
        "status": {
          "description": "Trip's new status",
          "type": "string",
          "enum": tripStatus
        },
        "eta": {
          "description": "Estimated time of arrival timestamp",
          "type": "string"
        },
        "product": {
          "$ref": "Update Trip Status Product"
        },
        "driver": {
          "$ref": "Update Trip Status Driver"
        }
      },
      "required": [
        "id",
        "status",
        "eta",
        "product",
        "driver"
      ]
    },
    "Quote": {
      "id": "Quote",
      "properties": {
        "customer_id": {
          "description": "Customer's unique identifier",
          "type": "string"
        },
        "passengers": {
          "description": "Number of passengers",
          "type": "integer"
        },
        "luggage": {
          "description": "Luggage quantity",
          "type": "integer"
        },
        "product_id": {
          "description": "Product's id",
          "type": "string"
        },
        "pickup_time": {
          "description": "Pickup time timestamp",
          "type": "string"
        },
        "pickup_location": {
          "description": "Pickup location",
          "$ref": "Location"
        },
        "dropoff_time": {
          "description": "Pickup time timestamp",
          "type": "string"
        },
        "dropoff_location": {
          "description": "Dropoff location",
          "$ref": "Location"
        },
        "payment_method_code": {
          "Description": "Desired payment method",
          "type": "string",
          "enum": paymentMethods
        }
      },
      "required": [
        "passengers",
        "luggage",
        "pickup_time",
        "pickup_location",
        "dropoff_location",
        "payment_method_code"
      ]
    },
    "Get Drivers Nearby": {
      "id": "Get Drivers Nearby",
      "properties": {
        "limit": {
          "description": "Limit the number of results. Default is 10.",
          "type": "integer"
        },
        "location": {
          "$ref": "Location"
        },
        "radius": {
          "description": "Radius of the search zone. Default is 100 meters.",
          "type": "number"
        },
        "product_id": {
          "description": "Filter to a single product's drivers",
          "type": "string"
        }
      },
      "required": [
        "location"
      ]
    },
    "Request Payment": {
      "id": "Request Payment",
      "properties": {
        "id": {
          "description": "Trip's identifier",
          "type": "string"
        },
        "fare": {
          "description": "Trip's fare",
          "type": "number"
        },
        "currency_code": {
          "description": "Currency code of trip's fare",
          "type": "string"
        }
      },
      "required": [
        "id",
        "fare",
        "currency_code"
      ]
    },
    "Accept Payment": {
      "id": "Accept Payment",
      "properties": {
        "id": {
          "description": "Trip's identifier",
          "type": "string"
        },
        "confirmation": {
          "description": "Payment confirmation by customer",
          "type": "boolean"
        },
        "tip": {
          "$ref": "Tip"
        }
      },
      "required": [
        "id",
        "confirmation"
      ]
    }
};