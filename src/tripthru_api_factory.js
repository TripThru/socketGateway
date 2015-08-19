var moment = require('moment');
var codes = require('./codes');
var resultCodes = codes.resultCodes;

// This module transforms incoming requests into inner structures known to the
// whole simulation, and transforms inner structures into outgoing requests.

// To do: Create actual Trip and Quote objects instead of just same structure;

var tripthruClientId = 'tripthru';

function successResponse() {
  return {
    result_code: codes.resultCodes.ok,
    result: 'OK'
  };
}

function failResponse(errorCode, message) {
  return {
    result_code: errorCode,
    result: message
  };
}

function idName(object) {
  var o = {};
  if(object.id) o.id = object.id;
  if(object.name) o.name = object.name;
  return o;
}

function apiLocation(location) {
  var loc = {
    lat: location.lat,
    lng: location.lng
  };
  if(location.description) loc.description = location.description;
  return loc;
}

function getISOStringFromMoment(moment) {
  return moment.utc().format().toString();
}

function getMomentFromISOString(dateString) {
  return moment.utc(dateString, moment.ISO_8601, true);
}


// Trips //
function createDispatchRequest(trip, quoteId) {
  var r = {
    id: trip.id,
    client_id: tripthruClientId,
    pickup_location: apiLocation(trip.pickupLocation),
    pickup_time: getISOStringFromMoment(trip.pickupTime),
    dropoff_location: apiLocation(trip.dropoffLocation),
    passengers: trip.passengers,
    luggage: trip.luggage,
    payment_method_code: trip.paymentMethod
  };
  r.customer = idName(trip.customer);
  if(trip.customer.localId) r.customer.local_id = trip.customer.localId;
  if(trip.customer.phoneNumber) r.customer.phone_number = trip.phoneNumber;
  if(quoteId) r.quoteId = quoteId;
  if(trip.servicingNetwork) {
    r.network_id = trip.servicingNetwork.id;
  }
  if(trip.servicingProduct) {
    r.product_id = trip.servicingProduct.id;
  }
  if(trip.guaranteedTip) {
    r.tip = {
      amount: trip.guaranteedTip.amount,
      currency_code: trip.guaranteedTip.currencyCode
    };
  }
  return r;
}

function createUpdateTripStatusRequest(trip) {
  var r = {
    id: trip.id,
    client_id: tripthruClientId,
    status: trip.status
  };
  if(trip.driver) {
    r.driver = idName(trip.driver);
    r.driver.location = apiLocation(trip.driver.location);
    r.driver.local_id = trip.driver.localId;
    if(trip.driver.nativeLanguage) {
      r.driver.native_language_id = trip.driver.nativeLanguage.id;
    }
  }
  if(trip.eta) {
    r.eta = getISOStringFromMoment(trip.eta);
  }
  if(trip.product) {
    r.product = idName(trip.product);
    r.product.image_url = trip.product.imageUrl;
  }
  return r;
}

function createGetTripStatusRequest(trip) {
  var r = {
    id: trip.id,
    client_id: tripthruClientId,
  };
  return r;
}

function createTripFromDispatchRequest(request) {
  var trip = {
    id: request.id,
    user: idName({id: request.client_id, name: request.client_id}),
    pickupLocation: apiLocation(request.pickup_location),
    pickupTime: getMomentFromISOString(request.pickup_time),
    dropoffLocation: apiLocation(request.dropoff_location),
    paymentMethod: request.payment_method_code,
    status: 'new',
    creation: moment().utc(),
    lastUpdate: moment().utc()
  };
  trip.customer = idName(request.customer);
  trip.customer.localId = request.customer.local_id;
  trip.customer.phoneNumber = request.customer.phone_number;
  if(request.network_id) {
    trip.servicingNetwork = idName({ id: request.network_id });
    if(request.product_id) {
      trip.servicingProduct = idName({ id : request.product_id });
    }
    trip.autoDispatch = false;
  } else {
    trip.autoDispatch = true;
  }
  if(request.tip) {
    trip.guaranteedTip = {
      amount: request.tip.amount,
      currencyCode: request.tip.currency_code
    };
  }
  return trip;
}

function createTripFromUpdateTripStatusRequest(request, trip) {
  trip.status = request.status;
  trip.lastUpdate = moment().utc();
  if(request.eta) {
    trip.eta = getMomentFromISOString(request.eta);
  }
  if(request.product) {
    trip.servicingProduct = idName(request.product);
    trip.servicingProduct.imageUrl = request.product.image_url;
  }
  if(request.driver) {
    if(!trip.driver) {
      trip.driver = idName(request.driver);
    }
    if(request.driver.location) {
      trip.driver.location = apiLocation(request.driver.location);
      if(trip.status === 'picked_up') {
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
      } else if(trip.status === 'completed') {
        trip.duration =
          moment.duration(moment().utc().diff(trip.pickupTime)).asMinutes();
      }
    }
  }
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
  if(response.fare) trip.fare = response.fare;
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
  r.status = trip.status;
  if(trip.eta) {
    r.eta = getISOStringFromMoment(trip.eta);
  }
  if(trip.product) {
    r.product = idName(trip.servicingProduct);
    r.product.image_url = trip.servicingProduct.imageUrl;
  }
  if(trip.driver) {
    r.driver = idName(trip.driver);
    r.driver.local_id = trip.driver.localId;
    if(trip.driver.nativeLanguage) {
      r.driver.native_language_id = trip.driver.nativeLanguage.id;
    }
    if(trip.driver.location) {
      r.driver.location = apiLocation(trip.driver.location);
    }
  }
  return r;
}

function createTripPaymentFromRequestPaymentRequest(request, trip) {
  return {
    trip: {
      id: trip.id
    },
    requestedAt: moment().utc(),
    amount: request.fare,
    currencyCode: request.currency_code,
    confirmation: false,
    tip: null
  };
}

function createTripPaymentFromAcceptPaymentRequest(request, tripPayment) {
  if(request.tip) {
    tripPayment.tip = {
      amount: request.tip.amount,
      currencyCode: request.tip.currency_code
    };
  }
  tripPayment.confirmed = request.confirmation;
  tripPayment.confirmedAt = moment().utc();
  return tripPayment;
}

function createRequestPaymentRequestFromTripPayment(tripPayment) {
  return {
    id: tripPayment.trip.id,
    client_id: tripthruClientId,
    fare: tripPayment.amount,
    currency_code: tripPayment.currencyCode
  };
}

function createAcceptPaymentRequestFromTripPayment(tripPayment) {
  var tp = {
    id: tripPayment.trip.id,
    confirmation: tripPayment.confirmed
  };
  if(tripPayment.tip) {
    tp.tip = {
      amount: tripPayment.tip.amount,
      currency_code: tripPayment.tip.currencyCode
    };
  }
  return tp;
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
      var quoteId = args ? args.quoteId : null;
      return createDispatchRequest(trip, quoteId);
    case 'update-trip-status':
      return createUpdateTripStatusRequest(trip, args);
    case 'get-trip-status':
      return createGetTripStatusRequest(trip);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createResponseFromTrip(trip, type, errorCode, message) {
  if(errorCode) {
    return failResponse(errorCode, message);
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
    case 'get-trip':
      if(!args || !args.trip) {
        throw new Error('Need trip object');
      }
      return createTripFromGetTripStatusResponse(response, args.trip);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createGetTripStatusResponseFromNetworkGetTripStatusResponse(response, trip) {
  response.originatingNetwork = trip.user;
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

function createResponseFromTripPayment(tripPayment, type, errorCode, message) {
  if(errorCode) {
    return failResponse(errorCode, message);
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
    clientId: trip.user.id,
    request: {
        id: trip.id,
        pickup_location: apiLocation(trip.pickupLocation),
        pickup_time: trip.pickupTime,
        dropoff_location: apiLocation(trip.dropoffLocation),
        customer_id: trip.customer.id || null,
        product_id: null,
        passengers: trip.passengers,
        luggage: trip.luggage,
        payment_method_code: trip.paymentMethod
    },
    receivedQuotes: []
  };
  return quote;
}

function createGetQuoteRequestFromQuote(quote) {
  return quote.request;
}

function createQuoteId(request) {
  return request.client_id + '-<' + request.pickup_location.lat + ':' +
          request.pickup_location.lng + '>-' + moment().format();
}

function createQuoteFromGetQuoteRequest(request) {
  var quote = {
    id: request.id ? request.id : createQuoteId(request),
    clientId: request.client_id,
    request: request,
    receivedQuotes: []
  };
  return quote;
}

function createGetQuoteResponseFromQuote(quote) {
  var r = successResponse();
  r.quotes = quote.receivedQuotes;
  return r;
}

function createRequestFromQuote(quote, type, args) {
  switch(type) {
    case 'get':
      return createGetQuoteRequestFromQuote(quote);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createResponseFromQuote(quote, type, errorCode, message) {
  if(errorCode) {
    return failResponse(errorCode, message);
  }
  switch(type) {
    case 'get':
      return createGetQuoteResponseFromQuote(quote);
    default:
      throw new Error('Invalid request type ' + type);
  }
}

function createQuoteFromRequest(quote, type, args) {
  switch(type) {
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
  user.products = [];
  user.name = request.name;
  user.callbackUrl = request.callback_url;
  for(var i = 0; i < request.products.length; i++) {
    var product = request.products[i];
    var p = {
      id: product.id,
      name: product.name,
      imageUrl: product.image_url,
      capacity: product.capacity,
      acceptsPrescheduled: product.accepts_prescheduled,
      acceptsOndemand: product.accepts_ondemand,
      acceptsCashPayment: product.accepts_cash_payment,
      acceptsAccountPayment: product.accepts_account_payment,
      acceptsCreditcardPayment: product.accepts_creditcard_payment
    };
    if(product.coverage && product.coverage.hasOwnProperty('length')){
      p.coverage = product.coverage;
    } else if(product.coverage && !product.coverage.hasOwnProperty('length') && product.coverage.radius) {
      p.coverage = [product.coverage];
    } else {
      p.coverage = [];
    }
    user.products.push(p);
  }
  return user;
}

function createGetNetworkInfoResponseFromUser(user) {
  var r = {
    id: user.clientId,
    name: user.name,
    products: []
  };
  for(var i = 0; i < user.products.length; i++) {
    var product = user.products[i];
    r.products.push({
      id: product.id,
      name: product.name,
      image_url: product.imageUrl,
      accepts_prescheduled: product.acceptsPrescheduled,
      accepts_ondemand: product.acceptsOndemand,
      accepts_cash_payment: product.acceptsCashPayment,
      accepts_account_payment: product.acceptsAccountPayment,
      accepts_creditcard_payment: product.acceptsCreditcardPayment,
      coverage: product.coverage
    });
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

function createResponseFromUser(user, type, errorCode, message) {
  if(errorCode) {
    return failResponse(errorCode, message);
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