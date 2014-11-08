var should = require('should');
var sinon = require('sinon');
var mockery = require('mockery');
var codes = require('../src/codes');
var tripFixtures = require('./fixtures/trips');
var userFixtures = require('./fixtures/users');
var quoteFixtures = require('./fixtures/quotes');
var store = require('../src/store/store');
var trips = require('../src/controller/trips');
var quotes = require('../src/controller/quotes');

var sandbox = sinon.sandbox.create();
var tripsWorker = require('../src/workers/trips');
var tripsModel = require('../src/model/trips');
var quotesModel = require('../src/model/quotes');
var testTrip; 
var tripsWorkerSpy;
var tripsModelSpy;
var quotesModelSpy;

describe("Controller tests", function(){
  
  beforeEach(function(){
    tripsWorkerSpy = {
        newDispatchJob: sandbox.spy(tripsWorker, 'newDispatchJob')
    }
    tripsModelSpy = {
        add: sandbox.spy(tripsModel, 'add'),
        update: sandbox.spy(tripsModel, 'update'),
        getById: sandbox.spy(tripsModel, 'getById')
    }
    quotesModelSpy = {
        add: sandbox.spy(quotesModel, 'add'),
        update: sandbox.spy(quotesModel, 'update'),
        getById: sandbox.spy(quotesModel, 'getById')
    }
  });
  
  it("should dispatch and get an invalid parameters error ", function (done){
    var testTrip = tripFixtures.incompleteTrip;
    trips.dispatchTrip(testTrip, function(res){
      res.result.should.be.equal(codes.resultCodes.invalidParameters);
      tripsWorkerSpy.newDispatchJob.called.should.be.equal(false);
      tripsModelSpy.add.called.should.be.equal(false);
      done();
    });
  });
  
  it("should dispatch correctly", function (done){
    var testTrip = tripFixtures.completeTrip;
    trips.dispatchTrip(testTrip, function(res){
      res.result.should.be.equal(codes.resultCodes.ok);
      tripsWorkerSpy.newDispatchJob.calledOnce.should.be.equal(true);
      tripsModelSpy.add.calledOnce.should.be.equal(true);
      done();
    });
  });
  
  it("should fail for dispatching same trip twice", function (done){
    var testTrip = tripFixtures.completeTrip;
    trips.dispatchTrip(testTrip, function(res){
      res.result.should.be.equal(codes.resultCodes.ok);
      tripsWorkerSpy.newDispatchJob.calledOnce.should.be.equal(true);
      tripsModelSpy.add.calledOnce.should.be.equal(true);      
      trips.dispatchTrip(testTrip, function(res){
        res.result.should.be.equal(codes.resultCodes.rejected);
        tripsWorkerSpy.newDispatchJob.calledOnce.should.be.equal(true);
        tripsModelSpy.add.calledOnce.should.be.equal(true);      
        done();
      });
    });
  });
  
  afterEach(function(){
    sandbox.restore();
    store.clear();
  });
});