var swagger = require('swagger-node-express');
var paramTypes = swagger.paramTypes;

// Note: The resource nickname must be the same the socket action name

module.exports = {
    setNetworkInfo: {
      'spec': {
        'description' : "Set your network's information",
        'path' : '/network/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'POST',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Set Network Info')
        ],
        'type' : 'Set Network Info',
        'nickname' : 'set-network-info',
        'socketAction': 'set-network-info'
      },
      'action': function (req, res){ }
    },
    getNetworkInfo: {
      'spec': {
        'description' : 'Get a network\'s information',
        'path' : '/network/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'GET',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Get Network Info')
        ],
        'type' : 'Get Network Info',
        'nickname' : 'get-network-info',
        'socketAction': 'get-network-info'
      },
      'action': function (req, res){ }
    },
    dispatch: {
      'spec': {
        'description' : "Dispatch a trip",
        'path' : '/trip/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'POST',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Dispatch')
        ],
        'type' : 'Dispatch',
        'nickname' : 'dispatch-trip',
        'socketAction' : 'dispatch-trip',
      },
      'action': function (req, res){ }
    },
    getTripStatus: {
      'spec': {
        'description' : "Get a trip's status",
        'path' : '/tripstatus/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'GET',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Get Trip Status')
        ],
        'type' : 'Get Trip Status',
        'nickname' : 'get-trip-status',
        'socketAction' : 'get-trip-status'
      },
      'action': function (req, res){ }
    },
    updateTripStatus: {
      'spec': {
        'description' : "Update a trip's status",
        'path' : '/tripstatus/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'PUT',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Update Trip Status')
        ],
        'type' : 'Update Trip Status',
        'nickname' : 'update-trip-status',
        'socketAction' : 'update-trip-status'
      },
      'action': function (req, res){ }
    },
    quote: {
      'spec': {
        'description' : "Request a trip quote",
        'path' : '/quote',
        'notes' : '',
        'summary' : '',
        'method': 'GET',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Quote')
        ],
        'type' : 'Quote',
        'nickname' : 'get-quote',
        'socketAction': 'get-quote'
      },
      'action': function (req, res){ }
    },
    getDriversNearby: {
      'spec': {
        'description' : "Request a list of drivers inside the specified zone",
        'path' : '/drivers',
        'notes' : '',
        'summary' : '',
        'method': 'GET',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Get Drivers Nearby')
        ],
        'type' : 'Get Drivers Nearby',
        'nickname' : 'get-drivers-nearby',
        'socketAction' : 'get-drivers-nearby'
      },
      'action': function (req, res){ }
    },
    requestPayment: {
      'spec': {
        'description' : "Request a trip's payment when completed",
        'path' : '/payment/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'POST',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Request Payment')
        ],
        'type' : 'Request Payment',
        'nickname' : 'request-payment',
        'socketAction' : 'request-payment'
      },
      'action': function (req, res){ }
    },
    acceptPayment: {
      'spec': {
        'description' : "Confirm a payment request",
        'path' : '/payment/{id}',
        'notes' : '',
        'summary' : '',
        'method': 'PUT',
        'parameters' : [
          paramTypes.body('body', 'Request body', 'Accept Payment')
        ],
        'type' : 'Accept Payment',
        'nickname' : 'accept-payment',
        'socketAction' : 'accept-payment'
      },
      'action': function (req, res){ }
    }
};
