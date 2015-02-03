var queue = require('./job_queue');
var quotes = require('../active_quotes');
var TripThruApiFactory = require('../tripthru_api_factory');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var moment = require('moment');
var logger = require('../logger');
var users = require('../controller/users');
var socket; // Initialized with init to avoid circular dependency
var tripsJobQueue; // Initialized with init to avoid circular dependency
var quoteMaxDuration = moment.duration(5, 'seconds'); // this parameter will be much lower once we can handle the load
var missedBookingPeriod = moment.duration(30, 'minutes');

function quote(job, done) {
  var quoteId = job.quoteId;
  var log = logger.getSublog(quoteId, 'tripthru', 'servicing', 'quote');
  done(); // Todo: implement delayed jobs to handle quote completion
  broadcastQuoteAndGetResult(quoteId, log)
    .bind({})
    .then(function(quote){
      this.quote = quote;
      this.quote.state = 'complete';
      log.log('Broadcasting quote', this.quote.request);
      for(var i = 0; i < this.quote.receivedQuotes.length; i++) {
        var q = this.quote.receivedQuotes[i];
        log.log('Quote received from ' + q.partner.id, q); 
      }
      return quotes.update(quote);
    })
    .then(function(){
      var updateRequest = TripThruApiFactory.createRequestFromQuote(this.quote, 'update');
      return forwardCompletedQuoteToPartner(this.quote.request.clientId, updateRequest, log);
    })
    .catch(socket.SocketError, function(err){
      log.log('SocketError quote error ' + quoteId + ' : ' + err);
    })
    .error(function(err){
      log.log('Error quoting ' + quoteId + ' : ' + err);
    });
}

function autoDispatchQuote(job, done) {
  var quoteId = job.quoteId;
  var log = logger.getSublog(quoteId, 'tripthru', 'servicing', 'quote');
  done();
  broadcastQuoteAndGetResult(quoteId, log)
    .bind({})
    .then(function(quote){
      this.quote = quote;
      this.quote.state = 'complete';
      return quotes.update(quote);
    })
    .then(function(){
      var bestQuote = getBestQuotePartnerId(this.quote.request, this.quote.receivedQuotes);
      var partner = bestQuote !== null ? bestQuote.partner : null;
      var fleet = bestQuote !== null ? bestQuote.fleet : null;
      var eta = bestQuote !== null ? bestQuote.eta.utc().toDate().toISOString() : null;
      var details = bestQuote !== null ? (partner.id + ', ETA: ' + eta) : 'None';
      
      log.log('Finding best quote: ' + details, this.quote.request);
      log.log('Broadcasting quote');
      for(var i = 0; i < this.quote.receivedQuotes.length; i++) {
        var q = this.quote.receivedQuotes[i];
        log.log('Quote received from ' + q.partner.id, q); 
      }
      if(bestQuote) {
        log.log('Best quote found from ' + partner.id, bestQuote);
      } else {
        log.log('No best quote found');
      }
      log.log('');
      
      tripsJobQueue.newAutoDispatchJob(quoteId, partner, fleet);
    })
    .catch(socket.SocketError, function(err){
      log.log('SocketError autodispatch quote error ' + quoteId + ' : ' + err);
    })
    .error(function(err){
      log.log('Error autodispatch quoting ' + quoteId + ' : ' + err);
    })
    .finally(done);
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
  return quotes
    .getById(quoteId)
    .bind({})
    .then(function(q){
      if(q) {
        this.quote = q;
        return users.getPartnersThatServeLocation(q.request.pickupLocation);
      } else {
        throw new Error('Quote ' + quoteId + ' not found');
      }
    })
    .then(function(usersThatServe){
      return socket.broadcastQuote(this.quote.request, usersThatServe);
    })
    .delay(quoteMaxDuration.asMilliseconds())
    .then(function(){
      return quotes.getById(quoteId);
    })
    .then(function(quote){
      if(quote.receivedQuotes.length > 0) {
        return quote;
      } else {
        return quotes.getById(quoteId).delay(quoteMaxDuration.asMilliseconds());
      }
    });
}

function forwardCompletedQuoteToPartner(sendTo, request, log){
  log.log('Forward complete quote to ' + sendTo, request);
  return socket
    .updateQuote(sendTo, request)
    .then(function(result){
      log.log('Response', result);
      if(result.result !== resultCodes.ok) {
        throw new socket.SocketError(result.resultCode, result.error);
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