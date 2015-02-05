var moment = require('moment');
var quotesModel = require('./model/quotes');
var Promise = require('bluebird');
var RedisClient = require("./store/redis_client");

function ActiveQuotes() {
  this.quoteRemovalSpan = moment.duration(5, 'minutes');
  this.redisClient = new RedisClient('quotes');
}

ActiveQuotes.prototype.add = function(quote) {
  return this
    .redisClient
    .add(quote.id, quote)
    .bind(this)
    .then(function(reply){
      //quotesModel.add(quote);
    });
};

ActiveQuotes.prototype.update = function(quote) { 
  return this
    .redisClient
    .update(quote.id, quote)
    .bind(this)
    .then(function(reply){
      //quotesModel.update(quote);
      if(isNonActiveState(quote.status)) {
        this.deactivate(quote);
      }
    });
};

ActiveQuotes.prototype.deactivate = function(quote) {
  setTimeout(function(){
    this.redisClient.del(quote.id);
  }.bind(this), this.quoteRemovalSpan.asMilliseconds());
};

ActiveQuotes.prototype.getById = function(id) {
  return this
    .redisClient
    .get(id)
    .then(function(quote){
      if(quote) {
        quote = toApiQuote(quote);
      }
      return quote;
    });
};

ActiveQuotes.prototype.clear = function() {
  this.redisClient.clear();
};

var isNonActiveState = function(state) {
  return state === 'complete';
};

var toApiQuote = function(redisQuote) {
  redisQuote.request.pickupTime = moment(redisQuote.request.pickupTime);
  for(var i = 0; i < redisQuote.receivedQuotes.length; i++) {
    var q = redisQuote.receivedQuotes[i];
    q.eta = moment(q.eta);
    if(q.duration) q.duration = moment.duration(q.duration, 'seconds');
  }
  return redisQuote;
};

module.exports = new ActiveQuotes();