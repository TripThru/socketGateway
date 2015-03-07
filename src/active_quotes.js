var moment = require('moment');
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
      this.deactivate(quote);
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

var toApiQuote = function(redisQuote) {
  return redisQuote;
};

module.exports = new ActiveQuotes();