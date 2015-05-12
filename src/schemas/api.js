var paymentMethods = ['cash', 'credit-card', 'account'];
var tripStatus =  [
                     'accepted', 
                     'en_route', 
                     'arrived',
                     'picked_up', 
                     'dropped_off', 
                     'no_show', 
                     'completed',
                     'rejected',
                     'cancelled'
                     ];
var timestamp = {
  "id": "http://www.tripthru.com/common/timestamp",
  "type": "string",
  "format": "date-time"
};

var location = {
  "id": "http://www.tripthru.com/common/location",
  "type": "object",
  "properties": {
    "lat": {
      "id": "http://www.tripthru.com/common/location/lat",
      "type": "number"
    },
    "lng": {
      "id": "http://www.tripthru.com/common/location/lng",
      "type": "number"
    },
    "description": {
      "id": "http://www.tripthru.com/common/location/description",
      "type": "string"
    }
  },
  "additionalProperties": false,
  "required": ["lat", "lng"]
};

module.exports = {
    paymentMethods: paymentMethods,
    tripStatus: tripStatus,
    setNetworkInfo: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/set-network-info",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "name": {
          "id": "http://www.tripthru.com/set-network-info/name",
          "type": "string"
        },
        "callback_url": {
          "id": "http://www.tripthru.com/set-network-info/callback_url",
          "type": "string"
        },
        "products": {
          "id": "http://www.tripthru.com/set-network-info/products",
          "type": "array",
          "items": {
            "id": "http://www.tripthru.com/set-network-info/products/0",
            "type": "object",
            "properties": {
              "id": {
                "id": "http://www.tripthru.com/set-network-info/products/0/id",
                "type": "string"
              },
              "name": {
                "id": "http://www.tripthru.com/set-network-info/products/0/name",
                "type": "string"
              },
              "image_url": {
                "id": "http://www.tripthru.com/set-network-info/products/0/image_url",
                "type": "string"
              },
              "capacity": {
                "id": "http://www.tripthru.com/set-network-info/products/0/capacity",
                "type": "integer"
              },
              "accepts_prescheduled": {
                "id": "http://www.tripthru.com/set-network-info/products/0/accepts_prescheduled",
                "type": "boolean"
              },
              "accepts_ondemand": {
                "id": "http://www.tripthru.com/set-network-info/products/0/accepts_ondemand",
                "type": "boolean"
              },
              "accepts_cash_payment": {
                "id": "http://www.tripthru.com/set-network-info/products/0/accepts_cash_payment",
                "type": "boolean"
              },
              "accepts_account_payment": {
                "id": "http://www.tripthru.com/set-network-info/products/0/accepts_account_payment",
                "type": "boolean"
              },
              "accepts_creditcard_payment": {
                "id": "http://www.tripthru.com/set-network-info/products/0/accepts_creditcard_payment",
                "type": "boolean"
              },
              "coverage": {
                "id": "http://www.tripthru.com/set-network-info/products/0/coverage",
                "type": "object",
                "properties": {
                    "center": location,
                    "radius": {
                      "id": "http://www.tripthru.com/set-network-info/products/0/coverage/0/radius",
                      "type": "integer"
                    },
                  "additionalProperties": false
                 }
              }
            },
            "required": [
              "id",
              "name",
              "image_url"
             ],
            "additionalProperties": false
          }
        }
      },
      "additionalProperties": false,
      "required": [
        "name",
        "products"
      ]
    },
    getNetworkInfo: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/get-network-info",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "id": {
          "id": "http://www.tripthru.com/get-network-info/id",
          "type": "string"
        }
      },
      "additionalProperties": false,
      "required": [
        "id"
      ]
    },
    dispatch: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/dispatch",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "id": {
          "id": "http://www.tripthru.com/dispatch/id",
          "type": "string"
        },
        "customer": {
          "id": "http://www.tripthru.com/dispatch/customer",
          "type": "object",
          "properties": {
            "id": {
              "id": "http://www.tripthru.com/dispatch/customer/id",
              "type": "string"
            },
            "name": {
              "id": "http://www.tripthru.com/dispatch/customer/name",
              "type": "string"
            },
            "local_id": {
              "id": "http://www.tripthru.com/dispatch/customer/local_id",
              "type": "string"
            },
            "phone_number": {
              "id": "http://www.tripthru.com/dispatch/customer/phone_number",
              "type": "string"
            }
          },
          "additionalProperties": false,
          "required": [
            "name"
          ]
        },
        "passengers": {
          "id": "http://www.tripthru.com/dispatch/passengers",
          "type": "integer"
        },
        "luggage": {
          "id": "http://www.tripthru.com/dispatch/luggage",
          "type": "integer"
        },
        "quote_id": {
          "id": "http://www.tripthru.com/dispatch/quote_id",
          "type": "string"
        },
        "network_id": {
          "id": "http://www.tripthru.com/dispatch/network_id",
          "type": "string"
        },
        "product_id": {
          "id": "http://www.tripthru.com/dispatch/product_id",
          "type": "string"
        },
        "pickup_time": timestamp,
        "pickup_location": location,
        "dropoff_location": location,
        "payment_method_code": {
          "id": "http://www.tripthru.com/dispatch/payment_method_code",
          "enum": paymentMethods
        },
        "tip": {
          "id": "http://www.tripthru.com/dispatch/tip",
          "type": "object",
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
          ],
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": [
        "customer",
        "passengers",
        "luggage",
        "pickup_time",
        "pickup_location",
        "dropoff_location",
        "payment_method_code"
      ]
    },
    getTripStatus: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/get-tripstatus",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "id": {
          "id": "http://www.tripthru.com/get-tripstatus/id",
          "type": "string"
        }
      },
      "additionalProperties": false,
      "required": [
        "id"
      ]
    },
    updateTripStatus: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/update-tripstatus",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "id": {
          "id": "http://www.tripthru.com/update-tripstatus/id",
          "type": "string"
        },
        "status": {
          "id": "http://www.tripthru.com/update-tripstatus/status",
          "enum": tripStatus
        },
        "eta": timestamp,
        "fare": {
          "id": "http://www.tripthru.com/update-tripstatus/fare",
          "type": "object",
          "properties": {
            "amount": {
              "id": "http://www.tripthru.com/update-tripstatus/fare/amount",
              "type": "number"
            },
            "currency_code": {
              "id": "http://www.tripthru.com/update-tripstatus/fare/currency_code",
              "type": "string"
            },
            "required": [
              "amount",
              "currency_code"
            ],
            "additionalProperties": false
          }
        },
        "product": {
          "id": "http://www.tripthru.com/update-tripstatus/product",
          "type": "object",
          "properties": {
            "id": {
              "id": "http://www.tripthru.com/update-tripstatus/product/id",
              "type": "string"
            },
            "name": {
              "id": "http://www.tripthru.com/update-tripstatus/product/name",
              "type": "string"
            },
            "image_url": {
              "id": "http://www.tripthru.com/update-tripstatus/product/image_url",
              "type": "string"
            }
          },
          "required": [
            "id",
            "name",
            "image_url"
          ],
          "additionalProperties": false
        },
        "driver": {
          "id": "http://www.tripthru.com/update-tripstatus/driver",
          "type": "object",
          "properties": {
            "id": {
              "id": "http://www.tripthru.com/update-tripstatus/driver/id",
              "type": "string"
            },
            "name": {
              "id": "http://www.tripthru.com/update-tripstatus/driver/name",
              "type": "string"
            },
            "local_id": {
              "id": "http://www.tripthru.com/update-tripstatus/driver/local_id",
              "type": "string"
            },
            "native_language_id": {
              "id": "http://www.tripthru.com/update-tripstatus/driver/native_language_id",
              "type": "string"
            },
            "location": location
          },
          "required": [
            "name",
            "location"
          ],
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": [
        "status",
        "eta",
        "product",
        "driver"
      ]
    },
    quote: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/quote",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "customer_id": {
          "id": "http://www.tripthru.com/quote/customer_id",
          "type": "string"
        },
        "passengers": {
          "id": "http://www.tripthru.com/quote/passengers",
          "type": "integer"
        },
        "luggage": {
          "id": "http://www.tripthru.com/quote/luggage",
          "type": "integer"
        },
        "product_id": {
          "id": "http://www.tripthru.com/quote/product_id",
          "type": "string"
        },
        "pickup_time": timestamp,
        "pickup_location": location,
        "dropoff_time": timestamp,
        "dropoff_location": location,
        "payment_method_code": {
          "id": "http://www.tripthru.com/quote/payment_method_code",
          "enum": paymentMethods
        }
      },
      "additionalProperties": false,
      "required": [
        "passengers",
        "luggage",
        "pickup_time",
        "pickup_location",
        "dropoff_location",
        "payment_method_code"
      ]
    },
    getDriversNearby: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/drivers",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "limit": {
          "id": "http://www.tripthru.com/drivers/limit",
          "type": "integer"
        },
        "location": location,
        "radius": {
          "id": "http://www.tripthru.com/drivers/radius",
          "type": "number"
        },
        "product_id": {
          "id": "http://www.tripthru.com/drivers/product_id",
          "type": "string"
        }
      },
      "additionalProperties": false,
      "required": [
        "location"
      ]
    },
    requestPayment: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/request-payment",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "id": {
          "id": "http://www.tripthru.com/request-payment/id",
          "type": "string"
        },
        "fare": {
          "id": "http://www.tripthru.com/request-payment/fare",
          "type": "number"
        },
        "currency_code": {
          "id": "http://www.tripthru.com/request-payment/currency_code",
          "type": "string"
        },
        "fare_summary": {
          "id": "http://www.tripthru.com/request-payment/fare_summary",
          "type": "string"
        }
      },
      "additionalProperties": false,
      "required": [
        "id",
        "fare",
        "currency_code"
      ]
    },
    acceptPayment: {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "id": "http://www.tripthru.com/accept-payment",
      "type": "object",
      "properties": {
        "client_id": {
          "id": "http://www.tripthru.com/common/client_id",
          "type": "string"
        },
        "id": {
          "id": "http://www.tripthru.com/accept-payment/id",
          "type": "string"
        },
        "confirmation": {
          "id": "http://www.tripthru.com/accept-payment/confirmation",
          "type": "boolean"
        },
        "tip": {
          "id": "http://www.tripthru.com/accept-payment/tip",
          "type": "object",
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
          ],
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": [
        "id",
        "confirmation"
      ]
    }
};