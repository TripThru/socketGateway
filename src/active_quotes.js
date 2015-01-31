var moment = require('moment');
var quotesModel = require('./model/quotes');
var Promise = require('bluebird');

function ActiveQuotes() {
  this.activeQuotesById = {};
  this.quoteRemovalSpan = moment.duration(5, 'minutes');
}

ActiveQuotes.prototype.add = function(quote) {
  if(this.activeQuotesById.hasOwnProperty(quote.id)) {
    return Promise.reject(new Error('Quote ' + quote.id + ' already exists'));
  }
  this.activeQuotesById[quote.id] = quote;
  //quotesModel.add(quote);
  return Promise.resolve();
};

ActiveQuotes.prototype.update = function(quote) { 
  if(!this.activeQuotesById.hasOwnProperty(quote.id)) {
    return Promise.reject(new Error('Quote ' + quote.id + ' does not exist'));
  }
  this.activeQuotesById[quote.id] = quote;
  //quotesModel.update(quote);
  if(isNonActiveState(quote.state)) {
    this.deactivate(quote);
  }
  return Promise.resolve();
};

ActiveQuotes.prototype.deactivate = function(quote) {
  var self = this;
  setTimeout(function(){
    var t = self.activeQuotesById[quote.id];
    if(t && isNonActiveState(t.state)) {
      delete self.activeQuotesById[quote.id];
    }
  }, this.quoteRemovalSpan.asMilliseconds());
};

ActiveQuotes.prototype.getById = function(id) {
  return Promise.resolve(this.activeQuotesById[id]);
};

var isNonActiveState = function(state) {
  return state === 'complete';
};

module.exports = new ActiveQuotes();