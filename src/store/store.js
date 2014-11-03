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
var User = mongoose.model('users', schemas.user);
Promise.promisifyAll(User);
Promise.promisifyAll(User.prototype);

var self = module.exports = {
  createTrip: function(trip) {
    return create(Trip, trip);
  },
  
  updateTrip: function(trip) {
    return update(Trip, trip);
  },
  
  getTripBy: function(query) { 
    return get(Trip, query);
  },
  
  createQuote: function(quote) {
    return create(Quote, quote);
  },
  
  updateQuote: function(quote) {
    return update(Quote, quote);
  },
    
  getQuoteBy: function(query) {
    return get(Quote, query);
  },
  
  createUser: function(user) {
    return create(User, user);
  },
  
  updateUser: function(user) {
    return update(User, user);
  },
    
  getUserBy: function(query) { 
    return get(User, query);
  },
  
  clear: function() {
    mongoose.connection.db.dropCollection('trip');
  }
}

function create(model, data) {
  return model.createAsync(data).then(function(res){
    return res;
  });
}

function update(model, data) {
  return model.updateAsync(query, {id: data.id}, data).then(function(res){
    return res;
  });
}

function get(model, query) {
  return model.findAsync(query).then(function(res){
    return res;
  });
}