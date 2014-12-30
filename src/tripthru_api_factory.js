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
  return moment.utc().toDate().toISOString();
}

function getMomentFromISOString(dateString) {
  return moment(dateString, moment.ISO_8601, true);
}

function createDispatchRequest(trip, partner) {
  var r = {
      id: trip.id,
      clientId: tripthruClientId,
      passenger: idName(trip.passenger),
      pickupLocation: apiLocation(trip.pickupLocation),
      pickupTime: getISOStringFromMoment(trip.pickupTime),
      dropoffLocation: apiLocation(trip.dropoffLocation)
  };
  if(trip.fleet) r.fleet = idName(trip.fleet);
  if(trip.driver) r.driver = idName(trip.driver);
  if(trip.vehicleType) r.vehicleType = trip.vehicleType;
  if(trip.servicingPartner) r.partner = idName(trip.servicingPartner);
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
      originatingPartner: idName({id: request.clientId, name: request.clientId}),
      passenger: request.passenger,
      pickupLocation: request.pickupLocation,
      pickupTime: getMomentFromISOString(request.pickupTime),
      dropoffLocation: request.dropoffLocation,
      status: 'new',
      state: 'new',
      creation: moment(),
      lastUpdate: moment()
  };
  if(request.fleet) trip.fleet = idName(request.fleet);
  if(request.driver) trip.driver = idName(request.driver);
  if(request.vehicleType) trip.vehicleType = request.vehicleType;
  if(request.partner) {
    trip.servicingPartner = idName(request.partner);
    trip.autoDispatch = false;
  } else {
    trip.autoDispatch = true;
  }
  return trip;
}

function createTripFromUpdateTripStatusRequest(request, trip) {
  trip.status = request.status;
  if(request.driver) { 
    trip.driver = idName(request.driver);
    if(request.driver.location) {
      trip.driver.location = apiLocation(request.driver.location);
      if(!trip.driver.initialLocation) {
        trip.driver.initialLocation = request.driver.location;
      }
      if(trip.status === 'enroute') {
        trip.driver.enrouteLocation = request.driver.location;
      } else if(trip.status === 'pickedup') {
        trip.driver.pickupLocation = request.driver.location;
      }
    }
  }
  if(request.eta) trip.eta = getMomentFromISOString(request.eta);
  trip.lastUpdate = moment();
  return trip;
}

function createTripFromGetTripStatusRequest(request) {
  var trip = {
    id: request.id  
  };
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
  r.originatingPartner = idName(trip.originatingPartner);
  if(trip.pickupTime) r.pickupTime = getISOStringFromMoment(trip.pickupTime);
  if(trip.dropoffTime) r.dropoffTime = getISOStringFromMoment(trip.dropoffTime);
  if(trip.eta) r.eta = getISOStringFromMoment(trip.eta);
  if(trip.servicingPartner) r.servicingPartner = idName(trip.servicingPartner);
  if(trip.fleet) r.fleet = idName(trip.fleet);
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


function createQuoteFromTrip(trip) {
  var quote = {
    id: trip.id,
    request: {
        clientId: trip.originatingPartner.id,
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
          partner: idName(q.partner),
          fleet: idName(q.fleet),
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
        partner: idName(q.partner),
        fleet: idName(q.fleet),
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


function createUserFromGetPartnerInfoRequest(request) {
  var r = {
      id: request.clientId
  };
  return r;
}

function createUserFromSetPartnerInfoRequest(request, user) {
  coverage = [];
  fleets = [];
  for(var i = 0; i < request.coverage.length; i++) {
    var c = request.coverage[i];
    coverage.push({
      center: apiLocation(c.center),
      radius: c.radius
    });
  }
  for(var i = 0; i < request.fleets.length; i++) {
    var fleet = request.fleets[i];
    fleets.push(idName(fleet));
  }
  user.coverage = coverage;
  user.fleets = fleets;
  user.vehicleTypes = request.vehicleTypes;
  return user;
}

function createGetPartnerInfoResponseFromUser(user) {
  var r = {
    coverage: user.coverage,
    fleets: [],
    vehicleTypes: user.vehicleTypes 
  };
  for(var i = 0; i < user.fleets; i++) {
    r.fleets.push(idName(user.fleets[i]));
  }
  return r;
}

function createSetPartnerInfoResponseFromUser(user) {
  return successResponse();
}

function createUserFromRequest(user, type, args) {
  switch(type) {
    case 'get-partner-info':
      return createUserFromGetPartnerInfoRequest(user);
    case 'set-partner-info':
      if(!args || !args.user) {
        throw new Error('Need user object to update');
      }
      return createUserFromSetPartnerInfoRequest(user, args.user);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createResponseFromUser(user, type, message, errorCode) {
  if(errorCode) {
    return failResponse(message, errorCode);
  }
  switch(type) {
    case 'get-partner-info':
      return createGetPartnerInfoResponseFromUser(user);
    case 'set-partner-info':
      return createSetPartnerInfoResponseFromUser(user);
    default:
      throw new Error('Invalid response type ' + type);
  }
}

function createGetTripStatusResponseFromPartnerGetTripStatusResponse(response, trip) {
  response.originatingPartner = trip.originatingPartner;
  response.servicingPartner = trip.servicingPartner;
  return response;
}

module.exports.createSuccessResponse = successResponse;
module.exports.createFaileResponse = failResponse;
module.exports.createRequestFromTrip = createRequestFromTrip;
module.exports.createResponseFromTrip = createResponseFromTrip;
module.exports.createTripFromRequest = createTripFromRequest;
module.exports.createGetTripStatusResponseFromPartnerGetTripStatusResponse = 
  createGetTripStatusResponseFromPartnerGetTripStatusResponse;
module.exports.createRequestFromQuote = createRequestFromQuote;
module.exports.createResponseFromQuote = createResponseFromQuote;
module.exports.createQuoteFromRequest = createQuoteFromRequest;
module.exports.createUserFromRequest = createUserFromRequest;
module.exports.createResponseFromUser = createResponseFromUser;
module.exports.createQuoteFromTrip = createQuoteFromTrip;