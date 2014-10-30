Promise = require('bluebird');
var should = require('should');
var codes = require('../src/codes');
var store = Promise.promisifyAll(require('../src/store/store'));
var trips = Promise.promisifyAll(require('../src/controller/trips'));
var quotes = Promise.promisifyAll(require('../src/controller/quotes'));
var tripFixtures = require('./fixtures/trips');
var userFixtures = require('./fixtures/users');
var quoteFixtures = require('./fixtures/quotes');

function clearStore() {
  store.clear();
}

describe("Controller tests", function() {
  it("should dispatch and get an invalid parameters error " +
  		"because of missing required request parameters", function () {
    var testTrip = tripFixtures.incompleteTrip;
    trips.dispatchTrip(testTrip, function(res) {
      res.result.should.be.equal(codes.resultCodes.invalidParameters);
    });
  });
  it("should dispatch and don't get an invalid parameters error " +
      "because request has all required parameters", function () {
    var testTrip = tripFixtures.completeTrip;
    trips.dispatchTrip(testTrip, function(res) {
      res.result.should.not.be.equal(codes.resultCodes.invalidParameters);
    });
  });
  afterEach(function() {
    clearStore();
  });
});