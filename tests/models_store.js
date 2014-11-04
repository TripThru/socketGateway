var should = require('should');
var store = require('../src/store/store');
var trips = require('../src/model/trips');
var users = require('../src/model/users');
var quotes = require('../src/model/quotes');
var tripFixtures = require('./fixtures/trips');
var userFixtures = require('./fixtures/users');
var quoteFixtures = require('./fixtures/quotes');

function clearStore() {
  store.clear();
}

describe("Model and store tests", function() {
  
  before(function(){
    clearStore();
  });
  
  it("should save a trip in store", function (done) {
    var testTrip = tripFixtures.completeTrip;
    trips.add(testTrip).then(function(res){
      return trips.getById(testTrip.id);
    }).then(function(trip){
      trip.id.should.be.equal(testTrip.id);
    })
    .finally(done);
  });
  
  it("should save a quote in store", function(done) {
    var testQuote = quoteFixtures.basicQuote;
    quotes.add(testQuote).then(function(res){
      return quotes.getById(testQuote.id);
    }).then(function(quote){
      quote.id.should.be.equal(testQuote.id);
    })
    .finally(done);
  });
  
  it("should save a user in store", function(done) {
    var testUser = userFixtures.basicUser;
    users.add(testUser).then(function(res){
      return users.getById(testUser.id);
    }).then(function(user){
      user.id.should.be.equal(testUser.id);
    })
    .finally(done);
  });
  
  afterEach(function() {
    clearStore();
  });
  
});