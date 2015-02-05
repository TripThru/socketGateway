var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var workers = require('../workers/quotes');
var logger = require('../logger');
var quotes = require('../active_quotes');
var users = require('./users');

function RequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, RequestError);
}
RequestError.prototype = Object.create(Error.prototype);
RequestError.prototype.constructor = RequestError;

function UnsuccessfulRequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, UnsuccessfulRequestError);
}
UnsuccessfulRequestError.prototype = Object.create(Error.prototype);
UnsuccessfulRequestError.prototype.constructor = UnsuccessfulRequestError;

function QuotesController() {
  this.gateway = null;
}

QuotesController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.gateway = gatewayClient;
};

QuotesController.prototype.createQuote =  function(request) {
  var log = logger.getSublog(request.id, 'origin', 'tripthru', 'quote');
  var validation = validate.quoteRequest(request);
  if(!validation.valid) {
    log.log('Invalid quote request from ' + request.clientId, request);
    var response = TripThruApiFactory.createResponseFromQuote(null, null,
        resultCodes.invalidParameters, validation.error.message);
    log.log('Response', response);
    return Promise.resolve(response);
  } else {
    var quote = TripThruApiFactory.createQuoteFromRequest(request, 'quote');
    return users
      .getById(request.clientId)
      .then(function(user){
        var name = user ? user.fullname : 'unknown';
        log.log('Quote request from ' + name, request);
        return quotes.getById(quote.id);
      })
      .then(function(res){
        if(!res) {
          return quotes.add(quote);
        }
        throw new RequestError(resultCodes.rejected, 'quote already exists');
      })
      .then(function(res){
        log.log('Creating quote job');
        workers.newQuoteJob(quote.id);
        var response = TripThruApiFactory.createResponseFromQuote(quote, 'quote');
        log.log('Response', response);
        return response;
      })
      .catch(RequestError, function(err){
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
  }
};

QuotesController.prototype.getQuote = function(request) {
  var log = logger.getSublog(request.id, 'origin', 'tripthru', 'get-quote');
  return  users
    .getById(request.clientId)
    .then(function(user){
      var name = user ? user.fullname : 'unknown';
      log.log('Get quote request from ' + name, request);
      return quotes.getById(request.id);
    })
    .then(function(quote){
      if(quote) {
        var response = TripThruApiFactory.createResponseFromQuote(quote, 'get');
        log.log('Response', response);
        return response;
      } else {
        throw new RequestError(resultCodes.rejected, 'quote not found');
      }
    })
    .catch(RequestError, function(err){
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

QuotesController.prototype.updateQuote = function(request) {
  //var log = logger.getSublog(request.id, 'servicing', 'tripthru', 'update-quote');
  //log.log('Update quote from ' + request.clientId, request);
  return  users
    .getById(request.clientId)
    .bind({})
    .then(function(user){
      //var name = user ? user.fullname : 'unknown';
      //log.log('Update quote request from ' + name, request);
      return quotes.getById(request.id);
    })
    .then(function(q){
      if(q) {
        this.quote = q;
        var partnerQuote = TripThruApiFactory.createQuoteFromRequest(request, 
            'update', {quote: q});
        return quotes.update(this.quote);
      }
      throw new RequestError(resultCodes.rejected, 'quote not found');
    })
    .then(function(){
      var response = TripThruApiFactory.createResponseFromQuote(this.quote, 'update');
      //log.log('Response', response);
      return response;
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromQuote(null, null, 
          err.resultCode, err.error);
      //log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromQuote(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      //log.log('Response', response);
      return response;
    });
};



QuotesController.prototype.createAutoDispatchQuote = function(trip) {
  var quote = TripThruApiFactory.createQuoteFromTrip(trip);
  return quotes
    .add(quote)
    .then(function(){
      workers.newAutoDispatchJob(quote.id);
    });
};

module.exports = new QuotesController();