var store = require('../store/store');

// Public

var self = module.exports = {
  add: function(quote) {
    return store.createQuote(quote).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred adding quote ' + err);
    });
  },
  update: function(quote) {
    return store.updateQuote(quote).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred updating quote ' + err);
    });
  },
  getById: function(quoteId) {
    return store.getQuoteBy({id: quoteId}).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred getting quote ' + err);
    });
  }
}
