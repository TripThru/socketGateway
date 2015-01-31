var config = require('../../config');
var schemas = require('../schemas/store');
var mongoose = require("mongoose");
Promise = require('bluebird');

mongoose.connect(config.db.url, function (err, res) {
  if (err) {
    console.log ('Error connecting to: ' + config.db.url + '. ' + err);
  } else {
    console.log('Successfully connected to: ' + config.db.url);
  }
});

var Trip = mongoose.model('trips', schemas.trip);
Promise.promisifyAll(Trip);
Promise.promisifyAll(Trip.prototype);
var Quote = mongoose.model('quotes', schemas.quote);
Promise.promisifyAll(Quote);
Promise.promisifyAll(Quote.prototype);
var User = mongoose.model('users', schemas.user, 'users');
Promise.promisifyAll(User);
Promise.promisifyAll(User.prototype);

function Store(){
  
}

Store.prototype.createTrip = function(trip) {
  return create(Trip, trip);
};
  
Store.prototype.updateTrip = function(trip) {
  return update(Trip, trip);
};
  
Store.prototype.getTripBy = function(query) { 
  return get(Trip, query);
};
  
Store.prototype.createQuote = function(quote) {
  return create(Quote, quote);
};
  
Store.prototype.updateQuote = function(quote) {
  return update(Quote, quote);
};
    
Store.prototype.getQuoteBy = function(query) {
  return get(Quote, query);
};
  
Store.prototype.createUser = function(user) {
  return create(User, user);
};
  
Store.prototype.updateUser = function(user) {
  return update(User, user);
};
    
Store.prototype.getUserBy = function(query) { 
  return get(User, query);
};

Store.prototype.getAllUsers = function() {
  return getAll(User);
};
  
Store.prototype.clear = function() {
  Trip.remove({}, function () { });
  Quote.remove({}, function () { });
};

Store.prototype.clearAllCompleted = function(beforeDate) {
  var query = {
    lastUpdate: {$lt: beforeDate}
  };
  Trip.remove(query, function(){});
};

function create(model, data) {
  return model.createAsync(data);
}

function update(model, data) {
  return model.updateAsync({id: data.id}, data);
}

function get(model, query) {
  return model.findAsync(query);
}

function getAll(model) {
  return model.findAsync();
}

module.exports = new Store();