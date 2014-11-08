var moment = require('moment');

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
  }
  return copy;
}

module.exports = {
    toTripFromDispatchRequest: function(request) {
      var r = clone(request);
      r.originatingPartner = { id: r.clientId };
      r.servicingPartner = r.partner;
      delete r['partner'];
      r.pickupTime = moment(r.pickupTime, moment.ISO_8601, true).toDate();
      r.dropoffTime = 
        r.dropoffTime && moment(r.dropoffTime, moment.ISO_8601, true).toDate();
      r.status = 'new';
      r.creation = new Date();
      r.lastUpdate = new Date();
      r.state = 'new';
      r.isDirty = false;
      r.madeDirtyBy = '';
      return r;
    },
    toTripFromUpdateTripStatusRequest: function(request, trip) {
      trip.status = request.status;
      trip.eta = moment(request.eta, moment.ISO_8601, true);
      trip.driver = request.driver;
      return trip;
    },
    toDispatchRequest: function(trip) {
      
    },
    toUpdateTripStatusRequest: function(trip) {
      
    },
    toGetTripStatusRequest: function(trip) {
      
    },
    toGetTripRequest: function(trip) {
      
    },
    toQuote: function(quoteRequest) {
      
    },
    toQuoteRequest: function(quote) { 
      
    },
    toUpdateQuoteRequest: function(quote) {
      
    },
    toGetQuoteRequest: function(quote) {
      
    }
}