var queue = require('./job_queue');
var quotes = require('../model/quotes');
var TripThruApiFactory = require('../tripthru_api_factory');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var moment = require('moment');
var logger = require('../logger');
var socket; // Initialized with init to avoid circular dependency
var tripsJobQueue; // Initialized with init to avoid circular dependency
var quoteMaxDuration = moment.duration(5, 'seconds');
var missedBookingPeriod = moment.duration(30, 'minutes');

function quote(job, done) {
  var quoteId = job.quoteId;
  var log = logger.getSublog(quoteId);
  log.log('Processing quote job ' + quoteId, job);
  broadcastQuoteAndGetResult(quoteId, log)
    .bind({})
    .then(function(quote){
      this.quote = quote;
      this.quote.state = 'complete';
      log.log('Changing quote state to complete');
      return quotes.update(quote);
    })
    .then(function(){
      var updateRequest = TripThruApiFactory.createRequestFromQuote(quote, 'update');
      return forwardCompletedQuoteToPartner(this.quote.request.clientId, this.updateRequest, log);
    })
    .then(done)
    .catch(socket.SocketError, function(err){
      log.log('SocketError quote error ' + quoteId + ' : ' + err);
    })
    .error(function(err){
      log.log('Error quoting ' + quoteId + ' : ' + err);
    });
}

function autoDispatchQuote(job, done) {
  var quoteId = job.quoteId;
  var log = logger.getSublog(quoteId);
  log.log('Processing autodispatch quote ' + quoteId, job);
  broadcastQuoteAndGetResult(quoteId, log)
    .bind({})
    .then(function(quote){
      this.quote = quote;
      this.quote.state = 'complete';
      log.log('Changing quote state to complete');
      return quotes.update(quote);
    })
    .then(function(){
      var bestQuote = getBestQuotePartnerId(this.quote.request, this.quote.receivedQuotes);
      var partnerId = bestQuote !== null ? bestQuote.partner.id : null;
      log.log('Creating autodispatch trip with best quote', {quote: quoteId, partner: partnerId});
      tripsJobQueue.newAutoDispatchJob(quoteId, partnerId);
      done();
    })
    .catch(socket.SocketError, function(err){
      log.log('SocketError autodispatch quote error ' + quoteId + ' : ' + err);
    })
    .error(function(err){
      log.log('Error autodispatch quoting ' + quoteId + ' : ' + err);
    });
}

function getBestQuotePartnerId(request, quotes) {
  var bestQuote = null;
  var bestEta = moment(request.pickupTime).add(missedBookingPeriod);
  
  for(var i = 0; i < quotes.length; i++) {
    var quote = quotes[i];
    var eta = quote.eta || moment(bestEta).subtract(moment.duration(1, 'minutes'));
    if(eta.isBefore(bestEta)) {
      bestEta = eta;
      bestQuote = quote;
    }
  }
  return bestQuote;
}

function broadcastQuoteAndGetResult(quoteId, log) {
  log.log('Broadcasting quote');
  return quotes
    .getById(quoteId)
    .bind({})
    .then(function(q){
      if(q) {
        this.quote = q;
        return socket.broadcastQuoteToAllPartnersThatServe(q.request);
      } else {
        throw new Error('Quote ' + quoteId + ' not found');
      }
    })
    .delay(quoteMaxDuration)
    .then(function(){
      return quotes.getById(quoteId);
    });
}

function forwardCompletedQuoteToPartner(sendTo, request, log){
  log.log('Forward complete quote to ' + sendTo, request);
  return socket
    .updateQuote(sendTo, updateRequest)
    .then(function(result){
      log.log('Response', result);
      if(result !== resultCodes.ok) {
        throw new SocketError(res.resultCode, res.error);
      }
    });
}

module.exports = {
  init: function(gateway, tripsJQ) {
    socket = gateway;
    tripsJobQueue = tripsJQ;
    queue.processJob('quote', quote);
    queue.processJob('autodispatch-quote', autoDispatchQuote);
  },
  newQuoteJob: function(quoteId) {
    var data = { quoteId: quoteId };
    queue.newJob('quote', data);
  },
  newAutoDispatchJob: function(quoteId) {
    var data = {quoteId: quoteId};
    queue.newJob('autodispatch-quote', data);
  }
};