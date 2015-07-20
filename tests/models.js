var should = require('should');
var sinon = require('sinon');
var moment = require('moment');
var sandbox = sinon.sandbox.create();
var Promise = require('bluebird');
var store = require('../src/store/store');
var tripsModel = require('../src/model/trips');
var tripPaymentsModel = require('../src/model/trip_payments');
var usersModel = require('../src/model/users');

function storeFixture(name) {
  return require('./fixtures/models/store_stub/' + name);
}

function modelFixture(name) {
  return require('./fixtures/models/' + name);
}

function stubStore() {
  sandbox.stub(store, 'createTrip').returns(Promise.resolve([1]));
  sandbox.stub(store, 'updateTrip').returns(Promise.resolve([1]));
  sandbox.stub(store, 'getTripById').returns(Promise.resolve(storeFixture('get_trip_result')));
  sandbox.stub(store, 'createTripLocation').returns(Promise.resolve([1]));
  sandbox.stub(store, 'getTripLocations').returns(Promise.resolve(storeFixture('get_locations_result')));
  sandbox.stub(store, 'createTripPayment').returns(Promise.resolve([1]));
  sandbox.stub(store, 'updateTripPayment').returns(Promise.resolve([1]));
  sandbox.stub(store, 'getTripPaymentByTripId').returns(Promise.resolve(storeFixture('get_payment_result')));
  sandbox.stub(store, 'createUser').returns(Promise.resolve([1]));
  sandbox.stub(store, 'updateUser').returns(Promise.resolve([1]));
  sandbox.stub(store, 'updateProducts').returns(Promise.resolve([1]));
  sandbox.stub(store, 'updateProductsCoverage').returns(Promise.resolve([1]));
  sandbox.stub(store, 'getUserById').returns(Promise.resolve(storeFixture('get_user_result')));
  sandbox.stub(store, 'getUserByToken').returns(Promise.resolve(storeFixture('get_user_result')));
  sandbox.stub(store, 'getAllUsers').returns(Promise.resolve(storeFixture('get_user_result')));
  sandbox.stub(store, 'getProducts').returns(Promise.resolve(storeFixture('get_products_result')));
  sandbox.stub(store, 'getUserProductsCoverage').returns(Promise.resolve(storeFixture('get_coverage_result')));
}

function restoreStore() {
  sandbox.restore();
}

function isSameDate(date1, date2) {
  if(!date1 && !date2) {
    return true;
  }
  return moment(date1).isSame(date2);
}

function usersShouldBeEqual(user1, user2) {
  user1.id.should.be.equal(user2.id);
  user1.name.should.be.equal(user2.name);
  user1.token.should.be.equal(user2.token);
  user1.role.should.be.equal(user2.role);
  user1.endpointType.should.be.equal(user2.endpointType);
  user1.callbackUrl.should.be.equal(user2.callbackUrl);
  user1.mustAcceptCashPayment.should.be.equal(user2.mustAcceptCashPayment);
  user1.mustAcceptPrescheduled.should.be.equal(user2.mustAcceptPrescheduled);
  user1.mustAcceptOndemand.should.be.equal(user2.mustAcceptOndemand);
  user1.mustAcceptAccountPayment.should.be.equal(user2.mustAcceptAccountPayment);
  user1.mustAcceptCreditcardPayment.should.be.equal(user2.mustAcceptCreditcardPayment);
  user1.minRating.should.be.equal(user2.minRating);
  user1.routingStrategy.should.be.equal(user2.routingStrategy);
  isSameDate(user1.creation, user2.creation).should.be.true;
  isSameDate(user1.lastUpdate, user2.lastUpdate).should.be.true;
  user1.products.length.should.be.equal(user2.products.length);
  for (var i = 0; i < user1.products.length; i++) {
    var p1 = user1.products[i];
    var p2 = user2.products[i];
    p1.id.should.be.equal(p2.id);
    p1.name.should.be.equal(p2.name);
    p1.imageUrl.should.be.equal(p2.imageUrl);
    p1.capacity.should.be.equal(p2.capacity);
    p1.acceptsPrescheduled.should.be.equal(p2.acceptsPrescheduled);
    p1.acceptsOndemand.should.be.equal(p2.acceptsOndemand);
    p1.acceptsCashPayment.should.be.equal(p2.acceptsCashPayment);
    p1.acceptsAccountPayment.should.be.equal(p2.acceptsAccountPayment);
    p1.acceptsCreditcardPayment.should.be.equal(p2.acceptsCreditcardPayment);
    p1.coverage.length.should.be.equal(p2.coverage.length);
    for (var j = 0; j < p1.coverage.length; j++) {
      var c1 = p1.coverage[j];
      var c2 = p2.coverage[j];
      c1.radius.should.be.equal(c2.radius);
      c1.center.lat.should.be.equal(c2.center.lat);
      c1.center.lng.should.be.equal(c2.center.lng);
    }
  }
}

describe('Users model tests', function(){

  before(function(){
    stubStore();
  });

  it('should create a user', function(done){
    usersModel
      .create(modelFixture('create_user_request'))
      .then(function(res){
        store.createUser.calledOnce.should.be.true;
        store.createUser.calledWithExactly(storeFixture('create_user_request')).should.be.true;
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should update a user', function(done){
    usersModel
      .update(modelFixture('update_user_request'))
      .then(function(res){
        store.updateUser.calledOnce.should.be.true;
        store.updateUser.calledWithExactly(storeFixture('update_user_request')).should.be.true;
        store.updateProducts.calledOnce.should.be.true;
        store.updateProducts.calledWithExactly(modelFixture('update_user_request').id, storeFixture('update_products_request')).should.be.true;
        store.updateProductsCoverage.calledOnce.should.be.true;
        store.updateProductsCoverage.calledWithExactly(modelFixture('update_user_request').id, storeFixture('update_coverage_request')).should.be.true;
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should get a user by id', function(done){
    usersModel
      .getById(modelFixture('get_user_by_id_request'))
      .then(function(res){
        store.getUserById.calledOnce.should.be.true;
        store.getUserById.calledWithExactly(storeFixture('get_user_by_id_request')).should.be.true;
        store.getProducts.calledOnce.should.be.true;
        store.getProducts.calledWithExactly(storeFixture('get_products_request')).should.be.true;
        store.getUserProductsCoverage.calledOnce.should.be.true;
        store.getUserProductsCoverage.calledWithExactly(storeFixture('get_coverage_request')).should.be.true;
        usersShouldBeEqual(modelFixture('get_user_result'), res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should get a user by token', function(done){
    usersModel
      .getByToken(modelFixture('get_user_by_token_request'))
      .then(function(res){
        store.getUserByToken.calledOnce.should.be.true;
        store.getUserByToken.calledWithExactly(storeFixture('get_user_by_token_request')).should.be.true;
        usersShouldBeEqual(modelFixture('get_user_result'), res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should get all users', function(done){
    usersModel
      .getAll()
      .then(function(res){
        store.getAllUsers.calledOnce.should.be.true;
        usersShouldBeEqual(modelFixture('get_user_result'), res[0]);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  after(function(){
    restoreStore();
  })

});

function locationsShouldBeEqual(location1, location2) {
  should(location1.lat).be.equal(location2.lat);
  should(location1.lng).be.equal(location2.lng);
  should(location1.description).be.equal(location2.description);
  isSameDate(location1.datetime, location2.datetime);
}

function tripsShouldBeEqual(trip1, trip2) {
  trip1.id.should.be.equal(trip2.id);
  trip1.originatingNetwork.id.should.be.equal(trip2.originatingNetwork.id);
  trip1.originatingProduct.id.should.be.equal(trip2.originatingProduct.id);
  trip1.customer.id.should.be.equal(trip2.customer.id);
  trip1.customer.name.should.be.equal(trip2.customer.name);
  trip1.customer.localId.should.be.equal(trip2.customer.localId);
  trip1.customer.phoneNumber.should.be.equal(trip2.customer.phoneNumber);
  locationsShouldBeEqual(trip1.pickupLocation, trip2.pickupLocation);
  isSameDate(trip1.pickupTime, trip2.pickupTime);
  locationsShouldBeEqual(trip1.dropoffLocation, trip2.dropoffLocation);
  isSameDate(trip1.dropoffTime, trip2.dropoffTime);
  trip1.driver.id.should.be.equal(trip2.driver.id);
  trip1.driver.name.should.be.equal(trip2.driver.name);
  trip1.driver.localId.should.be.equal(trip2.driver.localId);
  trip1.driver.phoneNumber.should.be.equal(trip2.driver.phoneNumber);
  trip1.driver.nativeLanguage.id.should.be.equal(trip2.driver.nativeLanguage.id);
  trip1.status.should.be.equal(trip2.status);
  isSameDate(trip1.lastUpdate, trip2.lastUpdate);
  trip1.autoDispatch.should.be.equal(trip2.autoDispatch);
  isSameDate(trip1.creation, trip2.creation);
  trip1.servicingNetwork.id.should.be.equal(trip2.servicingNetwork.id);
  trip1.servicingProduct.id.should.be.equal(trip2.servicingProduct.id);
  trip1.fare.should.be.equal(trip2.fare);
  trip1.latenessMilliseconds.should.be.equal(trip2.latenessMilliseconds);
  trip1.samplingPercentage.should.be.equal(trip2.samplingPercentage);
  trip1.serviceLevel.should.be.equal(trip2.serviceLevel);
  trip1.duration.should.be.equal(trip2.duration);
  trip1.distance.should.be.equal(trip2.distance);
  isSameDate(trip1.eta, trip2.eta);
  trip1.passengers.should.be.equal(trip2.passengers);
  trip1.luggage.should.be.equal(trip2.luggage);
  trip1.paymentMethod.should.be.equal(trip2.paymentMethod);
  trip1.guaranteedTip.amount.should.be.equal(trip2.guaranteedTip.amount);
  trip1.guaranteedTip.currencyCode.should.be.equal(trip2.guaranteedTip.currencyCode);
}

describe('Trips model tests', function(){

  before(function(){
    stubStore();
  });

  it('should create a trip', function(done){
    tripsModel
      .create(modelFixture('create_trip_request'))
      .then(function(res){
        store.createTrip.calledOnce.should.be.true;
        store.createTrip.calledWithExactly(storeFixture('create_trip_request')).should.be.true;
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should update a trip and create a location', function(done){
    tripsModel
      .update(modelFixture('update_trip_request'))
      .then(function(res){
        store.updateTrip.calledOnce.should.be.true;
        store.updateTrip.calledWithExactly(storeFixture('update_trip_request')).should.be.true;
        store.createTripLocation.calledOnce.should.be.true;
        store.createTripLocation.calledWithExactly(storeFixture('update_trip_request').id, storeFixture('create_location_request')).should.be.true;
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should get a trip by id', function(done){
    tripsModel
      .getById(modelFixture('get_trip_request'))
      .then(function(res){
        store.getTripById.calledOnce.should.be.equal.true;
        store.getTripById.calledWithExactly(storeFixture('get_trip_request')).should.be.true;
        tripsShouldBeEqual(modelFixture('get_trip_result'), res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  after(function(){
    restoreStore();
  });

});

function tripPaymentsShouldBeEqual(tp1, tp2) {
  tp1.trip.id.should.be.equal(tp2.trip.id);
  isSameDate(tp1.requestedAt, tp2.requestedAt);
  tp1.amount.should.be.equal(tp2.amount);
  tp1.currencyCode.should.be.equal(tp2.currencyCode);
  tp1.confirmed.should.be.equal(tp2.confirmed);
  isSameDate(tp1.confirmedAt, tp2.confirmedAt);
  tp1.tip.should.be.equal(tp2.tip);
}

describe('Trip payments model tests', function(){

  before(function(){
    stubStore();
  });

  it('should create a payment', function(done){
    tripPaymentsModel
      .create(modelFixture('create_payment_request'))
      .then(function(){
        store.createTripPayment.calledOnce.should.be.true;
        store.createTripPayment.calledWithExactly(storeFixture('create_payment_request')).should.be.true;
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should update a payment', function(done){
    tripPaymentsModel
      .update(modelFixture('update_payment_request'))
      .then(function(){
        store.updateTripPayment.calledOnce.should.be.true;
        store.updateTripPayment.calledWithExactly(storeFixture('update_payment_request')).should.be.true;
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should get a payment by trip id', function(done){
    tripPaymentsModel
      .getByTripId(modelFixture('get_payment_request'))
      .then(function(res){
        store.getTripPaymentByTripId.calledOnce.should.be.true;
        store.getTripPaymentByTripId.calledWithExactly(storeFixture('get_payment_request')).should.be.true;
        tripPaymentsShouldBeEqual(modelFixture('get_payment_result'), res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  after(function(){
    restoreStore();
  });

});