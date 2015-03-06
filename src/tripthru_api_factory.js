var moment = require('moment');
var codes = require('./codes');
var resultCodes = codes.resultCodes;

// This module transforms incoming requests into inner structures known to the 
// whole simulation, and transforms inner structures into outgoing requests.

// To do: Create actual Trip and Quote objects instead of just same structure;

var tripthruClientId = 'tripthru';

function successResponse() {
  return {
    result: codes.resultCodes.ok,
    message: 'ok'
  };
}

function failResponse(message, errorCode) {
  return {
    result: errorCode,
    message: message
  };
}

function idName(object) {
  return {
    id: object.id || null,
    name: object.name || null
  };
}

function apiLocation(location) {
  return {
    lat: location.lat,
    lng: location.lng
  };
}

function getISOStringFromMoment(moment) {
  return moment.utc().format().toString();
}

function getMomentFromISOString(dateString) {
  return moment.utc(dateString, moment.ISO_8601, true);
}


// TRIPS //
function createDispatchRequest(trip, network) {
  var r = {
      id: trip.id,
      clientId: tripthruClientId,
      passenger: idName(trip.passenger),
      pickupLocation: apiLocation(trip.pickupLocation),
      pickupTime: getISOStringFromMoment(trip.pickupTime),
      dropoffLocation: apiLocation(trip.dropoffLocation)
  };
  if(trip.product) r.product = idName(trip.product);
  if(trip.driver) r.driver = idName(trip.driver);
  if(trip.vehicleType) r.vehicleType = trip.vehicleType;
  if(trip.servicingNetwork) r.network = idName(trip.servicingNetwork);
  if(trip.servicingProduct) r.product = idName(trip.servicingProduct);
  return r;
}

function createUpdateTripStatusRequest(trip) {
  var r = {
      id: trip.id,
      clientId: tripthruClientId,
      status: trip.status
  };
  if(trip.driver) {
    r.driver = idName(trip.driver);
    r.driver.location = apiLocation(trip.driver.location);
  }
  if(trip.eta) r.eta = getISOStringFromMoment(trip.eta);
  return r;
}

function createGetTripStatusRequest(trip) {
  var r = {
      id: trip.id,
      clientId: tripthruClientId,
  };
  return r;
}

function createTripFromDispatchRequest(request) {
  var trip = {
      id: request.id,
      originatingNetwork: idName({id: request.clientId, name: request.clientId}),
      originatingProduct: idName(request.originatingProduct),
      passenger: request.passenger,
      pickupLocation: request.pickupLocation,
      pickupTime: getMomentFromISOString(request.pickupTime),
      dropoffLocation: request.dropoffLocation,
      status: 'new',
      state: 'new',
      creation: moment().utc(),
      lastUpdate: moment().utc()
  };
  if(request.driver) trip.driver = idName(request.driver);
  if(request.vehicleType) trip.vehicleType = request.vehicleType;
  if(request.network) {
    trip.servicingNetwork = idName(request.network);
    if(request.product) trip.servicingProduct = idName(request.product);
    trip.autoDispatch = false;
  } else {
    trip.autoDispatch = true;
  }
  return trip;
}

function createTripFromUpdateTripStatusRequest(request, trip) {
  trip.status = request.status;
  if(request.driver) { 
    if(!trip.driver) {
      trip.driver = idName(request.driver);
    }
    if(request.driver.location) {
      trip.driver.location = apiLocation(request.driver.location);
      if(!trip.driver.initialLocation) {
        trip.driver.initialLocation = request.driver.location;
      }
      if(trip.status === 'enroute') {
        trip.driver.routeEnrouteLocation = request.driver.location;
      } else if(trip.status === 'pickedup') {
        trip.driver.routePickupLocation = request.driver.location;
        trip.pickupTime = moment().utc();
        trip.latenessMilliseconds = 
          moment.duration(trip.pickupTime.diff(trip.creation)).asMilliseconds();
        var minutes = (trip.latenessMilliseconds / 1000) / 60;
        if(minutes < 3) {
          trip.serviceLevel = 0;
        } else if(minutes < 5) {
          trip.serviceLevel = 1;
        } else if(minutes < 10) {
          trip.serviceLevel = 2;
        } else if(minutes < 15) {
          trip.serviceLevel = 3;
        } else if(minutes > 15) {
          trip.serviceLevel = 4;
        }
      } else if(trip.status === 'complete') {
        trip.duration = 
          moment.duration(moment().utc().diff(trip.pickupTime)).asMinutes();
      }
    }
  }
  if(request.eta) trip.eta = getMomentFromISOString(request.eta);
  trip.lastUpdate = moment().utc();
  return trip;
}

function createTripFromGetTripStatusRequest(request) {
  var trip = {
    id: request.id  
  };
  return trip;
}

function createTripFromGetTripStatusResponse(response, trip) {
  if(response.distance) trip.distance = response.distance;
  if(response.price) trip.price = response.price;
  return trip;
}

function createDispatchResponse(trip) {
  return successResponse();
}

function createUpdateTripStatusResponse(trip) {
  return successResponse();
}

function createGetTripStatusResponse(trip) {
  var r = successResponse();
  r.passenger = idName(trip.passenger);
  r.pickupLocation = apiLocation(trip.pickupLocation);
  r.dropoffLocation = apiLocation(trip.dropoffLocation);
  r.vehicleType = trip.vehicleType;
  r.status = trip.status;
  r.originatingNetwork = idName(trip.originatingNetwork);
  if(trip.pickupTime) r.pickupTime = getISOStringFromMoment(trip.pickupTime);
  if(trip.dropoffTime) r.dropoffTime = getISOStringFromMoment(trip.dropoffTime);
  if(trip.eta) r.eta = getISOStringFromMoment(trip.eta);
  if(trip.servicingNetwork) r.servicingNetwork = idName(trip.servicingNetwork);
  if(trip.product) r.product = idName(trip.product);
  if(trip.price) r.price = trip.price;
  if(trip.distance) r.distance = trip.distance;
  if(trip.driver) {
    r.driver = idName(trip.driver);
    r.driver.location = apiLocation(trip.driver.location);
    r.driver.initialLocation = apiLocation(trip.driver.initialLocation);
    r.driver.routeDuration = trip.driver.routeDuration;
  }
  return r;
}

function createTripPaymentFromRequestPaymentRequest(request, trip) {
  return {
    tripId: trip.id,
    tripDbId: trip.dbId,
    requestedAt: moment().utc(),
    amount: request.fare,
    currencyCode: request.currencyCode,
    confirmation: false,
    tip: 0
  };
}

function createTripPaymentFromAcceptPaymentRequest(request, tripPayment) {
  tripPayment.tip = request.tip || 0;
  tripPayment.confirmation = request.confirmation;
  tripPayment.confirmedAt = moment().utc();
  return tripPayment;
}

function createRequestPaymentRequestFromTripPayment(tripPayment) {
  return {
    id: tripPayment.tripId,
    clientId: tripthruClientId,
    fare: tripPayment.amount,
    currencyCode: tripPayment.currencyCode
  };
}

function createAcceptPaymentRequestFromTripPayment(tripPayment) {
  return {
    id: tripPayment.tripId,
    confirmation: tripPayment.confirmation,
    tip: tripPayment.tip || 0
  };
}

function createAcceptPaymentResponseFromTripPayment(tripPayment) {
  return successResponse();
}

function createRequestPaymentResponseFromTripPayment(tripPayment) {
  return successResponse();
}


function createRequestFromTrip(trip, type, args) {
  switch(type) {
    case 'dispatch':
      return createDispatchRequest(trip);
    case 'update-trip-status':
      return createUpdateTripStatusRequest(trip, args);
    case 'get-trip-status':
      return createGetTripStatusRequest(trip);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createResponseFromTrip(trip, type, message, errorCode) {
  if(errorCode) {
    return failResponse(message, errorCode);
  }
  switch(type) {
    case 'dispatch':
      return createDispatchResponse(trip);
    case 'update-trip-status':
      return createUpdateTripStatusResponse(trip);
    case 'get-trip-status':
      return createGetTripStatusResponse(trip);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createTripFromRequest(trip, type, args) {
  switch(type) {
    case 'dispatch':
      return createTripFromDispatchRequest(trip);
    case 'update-trip-status':
      if(!args || !args.trip) {
        throw new Error('Need trip object to update');
      }
      return createTripFromUpdateTripStatusRequest(trip, args.trip);
    case 'get-trip-status':
      return createTripFromGetTripStatusRequest(trip);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createTripFromResponse(response, type, args) {
  switch(type) {
    case 'get-trip-status':
      if(!args || !args.trip) {
        throw new Error('Need trip object');
      }
      return createTripFromGetTripStatusResponse(response, args.trip);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createGetTripStatusResponseFromNetworkGetTripStatusResponse(response, trip) {
  response.originatingNetwork = trip.originatingNetwork;
  response.servicingNetwork = trip.servicingNetwork;
  return response;
}

function createTripPaymentFromRequest(request, type, args) {
  switch(type) {
    case 'request-payment':
      if(!args || !args.trip) {
        throw new Error('Need trip object to create trip payment');
      }
      return createTripPaymentFromRequestPaymentRequest(request, args.trip);
    case 'accept-payment':
      if(!args || !args.tripPayment) {
        throw new Error('Need trip payment object to update');
      }
      return createTripPaymentFromAcceptPaymentRequest(request, args.tripPayment);
    default:
      throw new Error('Invalid response type ' + type);
  }
}

function createRequestFromTripPayment(tripPayment, type) {
  if(!tripPayment) {
    throw new Error('Need trip payment object to create request');
  }
  switch(type) {
    case 'request-payment':
      return createRequestPaymentRequestFromTripPayment(tripPayment);
    case 'accept-payment':
      return createAcceptPaymentRequestFromTripPayment(tripPayment);
    default:
      throw new Error('Invalid response type ' + type);
  }
}

function createResponseFromTripPayment(tripPayment, type, message, errorCode) {
  if(errorCode) {
    return failResponse(message, errorCode);
  }
  if(!tripPayment) {
    throw new Error('Need trip payment object to create request');
  }
  switch(type) {
    case 'request-payment':
      return createRequestPaymentResponseFromTripPayment(tripPayment);
    case 'accept-payment':
      return createAcceptPaymentResponseFromTripPayment(tripPayment);
    default:
      throw new Error('Invalid response type ' + type);
  }
}

// Quotes //

function createQuoteFromTrip(trip) {
  var quote = {
    id: trip.id,
    request: {
        clientId: trip.originatingNetwork.id,
        id: trip.id,
        pickupLocation: apiLocation(trip.pickupLocation),
        pickupTime: trip.pickupTime,
        passenger: idName(trip.passenger),
        dropoffLocation: apiLocation(trip.dropoffLocation),
        vehicleType: trip.vehicleType
    },
    receivedQuotes: []
  };
  return quote;
}

function createQuoteFromQuoteRequest(request) {
  var quote = {
    id: request.id,
    request: {
        clientId: request.clientId,
        id: request.id,
        pickupLocation: apiLocation(request.pickupLocation),
        pickupTime: getMomentFromISOString(request.pickupTime),
        passenger: idName(request.passenger),
        dropoffLocation: apiLocation(request.dropoffLocation),
        vehicleType: request.vehicleType
    },
    receivedQuotes: []
  };
  return quote;
}

function createQuoteFromUpdateQuoteRequest(request, quote) {
  if(request.quotes.length > 0) {
    for(var i = 0; i < request.quotes.length; i++) {
      var q = request.quotes[i];
      var quoteUpdate = {
          network: idName(q.network),
          product: idName(q.product),
          eta: getMomentFromISOString(q.eta),
          vehicleType: q.vehicleType,
          price: q.price,
          distance: q.distance
      };
      if(q.duration) quoteUpdate.duration = moment.duration(q.duration, 'seconds');
      if(q.driver) quoteUpdate.driver = idName(q.driver);
      quote.receivedQuotes.push(quoteUpdate);
    }
  }
  return quote;
}

function createQuoteFromGetQuoteRequest(request) {
  var r = {
      id: request.id
  };
  return r;
}

function createQuoteResponseFromQuote(request) {
  return successResponse();
}

function createGetQuoteResponseFromQuote(quote) {
  var r = {
    id: quote.id,
    clientId: tripthruClientId,
    quotes: []
  };
  for(var i = 0; i < quote.receivedQuotes.length; i++) {
    var q = quote.receivedQuotes[i];
    if(q) {
      var qt = {
        network: idName(q.network),
        product: idName(q.product),
        eta: getISOStringFromMoment(q.eta),
        vehicleType: q.vehicleType,
        price: q.price,
        distance: q.distance
      };
      if(q.driver) qt.driver = idName(q.driver);
      if(q.passenger) qt.passenger = idName(q.passenger);
      if(q.duration) qt.duration = q.duration.asSeconds();
      r.quotes.push(qt);
    }
  }
  return r;
}

function createUpdateQuoteResponseFromQuote(quote) {
  return successResponse();
}

function createQuoteRequestFromQuote(quote) {
  throw new Error('Not implemented');
}

function createUpdateQuoteRequestFromQuote(quote) {
  return createGetQuoteResponseFromQuote(quote);
}

function createGetQuoteRequestFromQuote(quote) {
  throw new Error('Not implemented');
}

function createRequestFromQuote(quote, type, args) {
  switch(type) {
    case 'quote':
      return createQuoteRequestFromQuote(quote);
    case 'update':
      return createUpdateQuoteRequestFromQuote(quote);
    case 'get':
      return createGetQuoteRequestFromQuote(quote);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createResponseFromQuote(quote, type, message, errorCode) {
  if(errorCode) {
    return failResponse(message, errorCode);
  }
  switch(type) {
    case 'quote':
      return createQuoteResponseFromQuote(quote);
    case 'update':
      return createUpdateQuoteResponseFromQuote(quote);
    case 'get':
      return createGetQuoteResponseFromQuote(quote);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createQuoteFromRequest(quote, type, args) {
  switch(type) {
    case 'quote':
      return createQuoteFromQuoteRequest(quote);
    case 'update':
      if(!args || !args.quote) {
        throw new Error('Need quote object to update');
      }
      return createQuoteFromUpdateQuoteRequest(quote, args.quote);
    case 'get':
      return createQuoteFromGetQuoteRequest(quote);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

// Users //

function createUserFromGetNetworkInfoRequest(request) {
  var r = {
      clientId: request.clientId
  };
  return r;
}

function createUserFromSetNetworkInfoRequest(request, user) {
  user.products = request.products;
  for(var i = 0; i < user.products.length; i++) {
    user.products[i].product_id = user.products[i].id;
  }
  return user;
}

function createGetNetworkInfoResponseFromUser(user) {
  var r = {
    products: user.products
  };
  for(var i = 0; i < r.products.length; i++) {
    r.products[i].id = r.products[i].product_id;
  }
  return r;
}

function createSetNetworkInfoResponseFromUser(user) {
  return successResponse();
}

function createUserFromRequest(user, type, args) {
  switch(type) {
    case 'get-network-info':
      return createUserFromGetNetworkInfoRequest(user);
    case 'set-network-info':
      if(!args || !args.user) {
        throw new Error('Need user object to update');
      }
      return createUserFromSetNetworkInfoRequest(user, args.user);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createResponseFromUser(user, type, message, errorCode) {
  if(errorCode) {
    return failResponse(message, errorCode);
  }
  switch(type) {
    case 'get-network-info':
      return createGetNetworkInfoResponseFromUser(user);
    case 'set-network-info':
      return createSetNetworkInfoResponseFromUser(user);
    default:
      throw new Error('Invalid response type ' + type);
  }
}

module.exports.createSuccessResponse = successResponse;
module.exports.createFaileResponse = failResponse;
module.exports.createRequestFromTrip = createRequestFromTrip;
module.exports.createResponseFromTrip = createResponseFromTrip;
module.exports.createTripFromRequest = createTripFromRequest;
module.exports.createTripFromResponse = createTripFromResponse;
module.exports.createGetTripStatusResponseFromNetworkGetTripStatusResponse = 
  createGetTripStatusResponseFromNetworkGetTripStatusResponse;
module.exports.createRequestFromQuote = createRequestFromQuote;
module.exports.createResponseFromQuote = createResponseFromQuote;
module.exports.createQuoteFromRequest = createQuoteFromRequest;
module.exports.createUserFromRequest = createUserFromRequest;
module.exports.createResponseFromUser = createResponseFromUser;
module.exports.createQuoteFromTrip = createQuoteFromTrip;
module.exports.createTripPaymentFromRequest = createTripPaymentFromRequest;
module.exports.createRequestFromTripPayment = createRequestFromTripPayment;
module.exports.createResponseFromTripPayment = createResponseFromTripPayment;