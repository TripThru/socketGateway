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
  it("should save a trip in store", function () {
    var testTrip = tripFixtures.completeTrip;
    trips.add(testTrip);
    trips.getById(testTrip.id, function(trip) {
      trip.id.should.be.equal(testTrip.id);
    });
  });
  it("should save a quote in store", function() {
    var testQuote = quoteFixtures.basicQuote;
    quotes.add(testQuote);
    quotes.getById(testQuote.id, function(quote) {
      quote.id.should.be.equal(testQuote.id);
    });
  });
  it("should save a user in store", function() {
    var testUser = userFixtures.basicUser;
    users.add(testUser);
    users.getById(testUser.id, function(user) {
      user.id.should.be.equal(testUser.id);
    });
  });
  afterEach(function() {
    clearStore();
  });
});