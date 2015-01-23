var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var moment = require('moment');
var quotes = require('../model/quotes');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var workers = require('../workers/quotes');
var logger = require('../logger');

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
  this.socket = null;
}

QuotesController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.socket = gatewayClient;
};

QuotesController.prototype.createQuote =  function(request) {
  var log = logger.getSublog(request.id, 'origin', 'tripthru', 'quote');
  log.log('Quote request ' + request.id + ' from ' + request.clientId, request);
  var validation = validate.quoteRequest(request);
  if(!validation.valid) {
    var response = TripThruApiFactory.createResponseFromQuote(null, null,
        resultCodes.invalidParameters, validation.error.message);
    log.log('Response', response);
    return Promise.resolve(response);
  } else {
    var quote = TripThruApiFactory.createQuoteFromRequest(request, 'quote');
    return quotes
      .getById(quote.id)
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
  log.log('Get quote ' + request.id + ' from ' + request.clientId, request);
  return quotes
    .getById(request.id)
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
  var log = logger.getSublog(request.id, 'servicing', 'tripthru', 'update-quote');
  log.log('Update quote ' + request.id + ' from ' + request.clientId, request);
  return quotes
    .getById(request.id)
    .bind({})
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
};

module.exports = new QuotesController();