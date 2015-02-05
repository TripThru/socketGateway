var store = require('../store/store');
var moment = require('moment');

function cloneQuote(quote) {
  var qt = {
      id: quote.id,
      state: quote.state,
      request: {
        id: quote.request.id,
        clientId: quote.request.clientId,
        passenger: quote.request.passenger,
        pickupLocation: quote.request.pickupLocation,
        pickupTime: quote.request.pickupTime,
        dropoffLocation: quote.request.dropoffLocation,
        luggage: quote.request.luggage || 1,
        persons: quote.request.persons || 1,
        paymentMethod: quote.request.paymentMethod || 'cash',
        maxPrice: quote.request.maxPrice || 0
      },
      receivedQuotes: []
  };
  if(quote.request.vehicleType) qt.vehicleType = quote.request.vehicleType;
  if(quote.request.partner) qt.partner = quote.request.partner;
  if(quote.request.fleet) qt.fleet = quote.request.fleet;
  if(quote.request.driver) qt.driver = quote.request.driver;
  for(var i = 0; i < quote.receivedQuotes.length; i++) {
    var q = quote.receivedQuotes[i];
    var rq = {
      partner: q.partner,
      fleet: q.fleet,
      eta: q.eta,
      vehicleType: q.vehicleType,
      price: q.price,
      distance: q.distance,
      duration: q.duration
    };
    if(q.driver) rq.driver = q.request.driver;
    if(q.passenger) rq.driver = q.request.driver;
    qt.receivedQuotes.push(rq);
  }
  return qt;
}

function toStoreQuote(apiQuote) {
  var quote = cloneQuote(apiQuote);
  quote.request.pickupTime = quote.request.pickupTime.toDate();
  for(var i = 0; i < quote.receivedQuotes.length; i++) {
    var q = quote.receivedQuotes[i];
    q.eta = q.eta.toDate();
    if(q.duration) q.duration = q.duration.asSeconds();
  }
  return quote;
}

function toApiQuote(storeQuote) {
  var quote = cloneQuote(storeQuote);
  quote.request.pickupTime = moment(quote.request.pickupTime);
  for(var i = 0; i < quote.receivedQuotes.length; i++) {
    var q = quote.receivedQuotes[i];
    q.eta = moment(q.eta);
    if(q.duration) q.duration = moment.duration(q.duration, 'seconds');
  }
  return quote;
}

function QuotesModel() {
  
}

QuotesModel.prototype.add = function(quote) {
  quote.state = 'inProgress'; //This should be done in a Quote constructor
  return store.createQuote(toStoreQuote(quote));
};

QuotesModel.prototype.update = function(quote) {
  return store.updateQuote(toStoreQuote(quote));
};

QuotesModel.prototype.getById = function(id) {
  return store
    .getQuoteBy({id: id})
    .then(function(res){
      return res.length > 0 ? toApiQuote(res[0].toObject()) : null;
    });
};

module.exports = new QuotesModel();
