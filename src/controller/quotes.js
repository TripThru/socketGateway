var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var logger = require('../logger');
var quotes = require('../active_quotes');
var users = require('./users');
var activeQuotes = require('../active_quotes');
var InvalidRequestError = require('../errors').InvalidRequestError;
var UnsuccessfulRequestError = require('../errors').UnsuccessfulRequestError;
var missedBookingPeriod = moment.duration(30, 'minutes');

function QuotesController() {
  this.gateway = null;
}

QuotesController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.gateway = gatewayClient;
};

QuotesController.prototype.getQuote =  function(request) {
  var log = logger.getSublog(request.id, 'origin', 'tripthru', 'quote');
  var self = this;
  return validate
    .getQuoteRequest(request)
    .bind({})
    .then(function(validation) {
      if(validation.valid) {
        this.quote = TripThruApiFactory.createQuoteFromRequest(request, 'get');
        return users.getByClientId(request.client_id);
      } else {
        log.log('Invalid quote request from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Quote request from ' + name, request);
      return users.getNetworksThatServeLocation(this.quote.request.pickup_location);
    })
    .then(function(networksThatServeLocation){
      var requestingId = this.quote.clientId;
      var networks = networksThatServeLocation.filter(function(network){
        return network.clientId !== requestingId;
      });
      log.log('Broadcasting quote', this.quote.request);
      return self.gateway.broadcastQuote(this.quote.request, networks);
    })
    .then(function(res){
      if(res.length <= 0) {
        throw new UnsuccessfulRequestError(resultCodes.rejected, 'No quotes found');
      }
      this.quote.receivedQuotes = res;
      res.forEach(function(r){ 
        activeQuotes.add(r);
      });
      for(var i = 0; i < this.quote.receivedQuotes.length; i++) {
        var q = this.quote.receivedQuotes[i];
        log.log('Quote received from ' + q.network.id, q); 
      }
      var response = TripThruApiFactory.createResponseFromQuote(this.quote, 'get');
      log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, UnsuccessfulRequestError, function(err){
      var response = TripThruApiFactory.createResponseFromQuote(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromQuote(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

QuotesController.prototype.getBestQuote = function(trip) {
  var log = logger.getSublog(trip.id, 'tripthru', 'servicing', 'quote');
  var quote = TripThruApiFactory.createQuoteFromTrip(trip);
  var self = this;
  return users
    .getNetworksThatServeLocation(quote.request.pickup_location)
    .then(function(networksThatServeLocation){
      var requestingId = quote.clientId;
      var networks = networksThatServeLocation.filter(function(network){
        return network.clientId !== requestingId;
      });
      return self.gateway.broadcastQuote(quote.request, networks);
    })
    .then(function(quotes){
      var bestQuote = getBestQuoteFromQuoteBroadcastResult(trip.pickupTime, quotes);
      var network = bestQuote !== null ? bestQuote.network : null;
      var product = bestQuote !== null ? bestQuote.product : null;
      var eta = bestQuote !== null ? moment(bestQuote.eta).utc().toDate().toISOString() : null;
      var details = bestQuote !== null ? (network.name + ', ETA: ' + eta) : 'None';
      
      log.log('Finding best quote: ' + details, quote.request);
      log.log('Broadcasting quote');
      for(var i = 0; i < quotes.length; i++) {
        var q = quotes[i];
        log.log('Quote received from ' + q.network.name, q); 
      }
      if(bestQuote) {
        log.log('Best quote found from ' + network.name, bestQuote);
      } else {
        log.log('No best quote found');
      }
      log.log('');
      return bestQuote;
    });
};

function getBestQuoteFromQuoteBroadcastResult(pickupTime, quotes) {
  var bestQuote = null;
  var bestEta = moment(pickupTime).add(missedBookingPeriod);
  
  for(var i = 0; i < quotes.length; i++) {
    var quote = quotes[i];
    var eta = moment(quote.eta) || moment(bestEta).subtract(moment.duration(1, 'minutes'));
    if(eta.isBefore(bestEta)) {
      bestEta = eta;
      bestQuote = quote;
    }
  }
  return bestQuote;
}

module.exports = new QuotesController();