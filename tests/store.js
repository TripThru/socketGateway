var should = require('should');
var Promise = require('bluebird');
var moment = require('moment');
var testConfig = require('./config/store').db;
var store = require('../src/store/store');
store.init(testConfig);
var resetStore = require('./helpers/reset_store');
var User = require('./helpers/store/users');
var Trip = require('./helpers/store/trips');

function isSameDate(date1, date2) {
  if(!date1 && !date2) {
    return true;
  }
  return moment(date1).isSame(date2);
}

function usersShouldBeEqual(fixUser, storeUser) {
  fixUser.id.should.be.equal(storeUser[0].id);
  fixUser.name.should.be.equal(storeUser[0].name);
  fixUser.passwordHash.should.be.equal(storeUser[0].password_digest);
  fixUser.email.should.be.equal(storeUser[0].email);
  fixUser.token.should.be.equal(storeUser[0].token);
  fixUser.role.should.be.equal(storeUser[0].role);
  fixUser.endpointType.should.be.equal(storeUser[0].endpoint_type);
  fixUser.callbackUrl.should.be.equal(storeUser[0].callback_url);
  isSameDate(fixUser.createdAt, storeUser[0].created_at);
  isSameDate(fixUser.lastUpdate, storeUser[0].updated_at);
};

function productsShouldBeEqual(fixProducts, storeProducts) {
  fixProducts.length.should.be.equal(storeProducts.length);
  for (var i = 0; i < fixProducts.length; i++) {
    var fixProduct = fixProducts[i];
    var storeProduct = storeProducts[i];
    fixProduct.id.should.be.equal(storeProduct.id);
    fixProduct.name.should.be.equal(storeProduct.name);
    fixProduct.imageUrl.should.be.equal(storeProduct.image_url);
    fixProduct.capacity.should.be.equal(storeProduct.capacity);
    fixProduct.acceptsPrescheduled.should.be.equal(storeProduct.accepts_prescheduled === 1);
    fixProduct.acceptsOndemand.should.be.equal(storeProduct.accepts_ondemand === 1);
    fixProduct.acceptsCashPayment.should.be.equal(storeProduct.accepts_cash_payment === 1);
    fixProduct.acceptsAccountPayment.should.be.equal(storeProduct.accepts_account_payment === 1);
    fixProduct.acceptsCreditcardPayment.should.be.equal(storeProduct.accepts_creditcard_payment === 1);
  }
}

function mergeProductsCoverages(products) {
  var fixCoverages = [];
  for (var i = 0; i < products.length; i++) {
    fixCoverages = fixCoverages.concat(products[i].coverage);
  }
  return fixCoverages;
}

function coveragesShouldBeEqual(fixCoverages, storeCoverages) {
  fixCoverages.length.should.be.equal(storeCoverages.length);
  for (var i = 0; i < fixCoverages.length; i++) {
    var f = fixCoverages[i];
    var s = storeCoverages[i];
    f.radius.should.be.equal(s.coverage_radius);
    f.center.lat.should.be.equal(s.coverage_lat);
    f.center.lng.should.be.equal(s.coverage_lng);
  }
}

describe('Store user tests', function(){

  beforeEach(function(done){
    resetStore(store)
      .then(function(){
        done();
      })
      .error(function(err){
        done(new Error(err))
      });
  });

  it('should create a user and get it by id', function(done){
    var user = new User();
    store
      .createUser(user)
      .then(function(){
        return store.getUserById(user.id);
      })
      .then(function(res){
        res.length.should.be.equal(1);
        usersShouldBeEqual(user, res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should create a user and get it by token', function(done){
    var user = new User();
    store
      .createUser(user)
      .then(function(){
        return store.getUserByToken(user.token);
      })
      .then(function(res){
        res.length.should.be.equal(1);
        usersShouldBeEqual(user, res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should update a user', function(done){
    var user = new User();
    store
      .createUser(user)
      .then(function(res){
        user.update();
        return store
          .updateUser(user)
          .then(function(){
            return store.getUserById(user.id);
          })
      })
      .then(function(res){
        usersShouldBeEqual(user, res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should update users products', function(done){
    var user = new User();
    store
      .createUser(user)
      .then(function(res){
        user.addProducts();
        return store
          .updateProducts(user.id, user.products)
          .then(function(){
            return store.getProducts(user.id);
          });
      })
      .then(function(res){
        productsShouldBeEqual(user.products, res);
      })
      .then(function(res){
        user.updateProducts();
        return store
          .updateProducts(user.id, user.products)
          .then(function(){
            return store.getProducts(user.id);
          });
      })
      .then(function(res){
        productsShouldBeEqual(user.products, res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it('should update product coverage zones', function(done){
    var user = new User();
    user.addProducts();
    store
      .createUser(user)
      .then(function(res){
        return store
          .updateProducts(user.id, user.products)
          .then(function(){
            return store.updateProductsCoverage(user.id, user.products);
          })
          .then(function(){
            return store.getUserProductsCoverage(user.id);
          });
      })
      .then(function(res){
        coveragesShouldBeEqual(mergeProductsCoverages(user.products), res);
      })
      .then(function(res){
        user.updateProducts();
        return store
          .updateProductsCoverage(user.id, user.products)
          .then(function(){
            return store.getUserProductsCoverage(user.id);
          });
      })
      .then(function(res){
        coveragesShouldBeEqual(mergeProductsCoverages(user.products), res);
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  after(function(done){
    resetStore(store)
      .then(function(){
        done();
      })
      .error(function(err){
        done(new Error(err))
      });
  });
});


function tripsShouldBeEqual(fixTrip, storeTrip) {
  should(storeTrip.user_id).be.equal(fixTrip.user.id);
  should(storeTrip.product_id).be.equal(fixTrip.product.id);
  should(storeTrip.customer_name).be.equal(fixTrip.customer.name);
  should(storeTrip.customer_id).be.equal(fixTrip.customer.id);
  should(storeTrip.customer_local_id).be.equal(fixTrip.customer.localId);
  should(storeTrip.customer_phone_number).be.equal(fixTrip.customer.phoneNumber);
  should(storeTrip.driver_id).be.equal(fixTrip.driver.id);
  should(storeTrip.driver_name).be.equal(fixTrip.driver.name);
  should(storeTrip.driver_local_id).be.equal(fixTrip.driver.localId);
  should(storeTrip.driver_native_language_id).be.equal(fixTrip.driver.nativeLanguage.id);
  should(storeTrip.driver_phone_number).be.equal(fixTrip.driver.phoneNumber);
  should(storeTrip.trip_id).be.equal(fixTrip.id);
  should(storeTrip.servicing_network_id).be.equal(fixTrip.servicingNetwork.id);
  should(storeTrip.servicing_product_id).be.equal(fixTrip.servicingProduct.id);
  should(storeTrip.pickup_location_lat).be.equal(fixTrip.pickupLocation.lat);
  should(storeTrip.pickup_location_lng).be.equal(fixTrip.pickupLocation.lng);
  should(storeTrip.pickup_location_description).be.equal(fixTrip.pickupLocation.description);
  isSameDate(storeTrip.pickup_time, fixTrip.pickupTime).should.be.true;
  should(storeTrip.dropoff_location_lat).be.equal(fixTrip.dropoffLocation.lat);
  should(storeTrip.dropoff_location_lng).be.equal(fixTrip.dropoffLocation.lng);
  should(storeTrip.dropoff_location_description).be.equal(fixTrip.dropoffLocation.description);
  isSameDate(storeTrip.dropoff_time, fixTrip.dropoffTime).should.be.true;
  should(storeTrip.fare).be.equal(fixTrip.fare);
  should(storeTrip.status).be.equal(fixTrip.status);
  isSameDate(storeTrip.last_update, fixTrip.lastUpdate).should.be.true;
  should(storeTrip.autodispatch === 1).be.equal(fixTrip.autoDispatch);
  should(storeTrip.lateness_milliseconds).be.equal(fixTrip.latenessMilliseconds);
  should(storeTrip.sampling_percentage).be.equal(fixTrip.samplingPercentage);
  should(storeTrip.service_level).be.equal(fixTrip.serviceLevel);
  should(storeTrip.duration_seconds).be.equal(fixTrip.duration);
  should(storeTrip.distance).be.equal(fixTrip.distance);
  isSameDate(storeTrip.created_at, fixTrip.creation).should.be.true;
  isSameDate(storeTrip.eta, fixTrip.eta).should.be.true;
  should(storeTrip.passengers).be.equal(fixTrip.passengers);
  should(storeTrip.luggage).be.equal(fixTrip.luggage);
  should(storeTrip.payment_method).be.equal(fixTrip.paymentMethod);
  should(storeTrip.guaranteed_tip_amount).be.equal(fixTrip.guaranteedTip.amount);
  should(storeTrip.guaranteed_tip_currency_code).be.equal(fixTrip.guaranteedTip.currencyCode);
}

function locationsShouldBeEqual(location1, location2) {
  should(location1.lat).be.equal(location2.lat);
  should(location1.lng).be.equal(location2.lng);
  should(location1.description).be.equal(location2.description);
  isSameDate(location1.datetime, location2.datetime);
}

function tripPaymentsShouldBeEqual(fixPayment, storePayment) {
  isSameDate(fixPayment.requestedAt, storePayment.requested_at);
  isSameDate(fixPayment.confirmedAt, storePayment.confirmed_at);
  fixPayment.amount.should.be.equal(storePayment.amount);
  fixPayment.currencyCode.should.be.equal(storePayment.currency_code);
  fixPayment.confirmed.should.be.equal(storePayment.confirmed === 1);
  fixPayment.tip.should.be.equal(storePayment.tip);
};

describe('Store trip tests', function(){

  var originatingUser;
  var servicingUser;
  var createUser = function() {
    var user = new User();
    user.update();
    return store
      .createUser(user)
      .then(function(res){
        user.addProducts();
        return store.updateProducts(user.id, user.products)
      })
      .then(function(){
        return user;
      });
  }

  beforeEach(function(done){
    resetStore(store)
      .then(function(){
        return Promise.all([createUser(store), createUser(store)]);
      })
      .then(function(results){
        originatingUser = results[0];
        servicingUser = results[1];
        done();
      })
      .error(function(err){
        done(new Error(err));
      });
  });

  it("should insert a trip", function(done){
    var trip = new Trip(originatingUser, originatingUser.products[0], servicingUser, servicingUser.products[0]);
    store
      .createTrip(trip)
      .then(function(res){
        return store.getTripById(trip.id);
      })
      .then(function(res){
        res.length.should.be.equal(1);
        tripsShouldBeEqual(trip, res[0]);
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it("should update a trip", function(done){
    var trip = new Trip(originatingUser, originatingUser.products[0], servicingUser, servicingUser.products[0]);
    store
      .createTrip(trip)
      .then(function(res){
        trip.update();
        return store
          .updateTrip(trip)
          .then(function(){
            return store.getTripById(trip.id);
          });
      })
      .then(function(res){
        res.length.should.be.equal(1);
        tripsShouldBeEqual(trip, res[0]);
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  function createNewLocationAndUpdate(trip) {
    trip.updateDriverLocation();
    return store
      .createTripLocation(trip.id, trip.driver.location)
      .then(function(){
        return store.getTripLocations(trip.id);
      });
  }

  function verifyLocation(tripLocations, storeLocations) {
    storeLocations.length.should.be.equal(tripLocations.length);
    for(var i = 0; i < tripLocations.length; i++) {
      locationsShouldBeEqual(tripLocations[i], storeLocations[i]);
    }
  }

  it('should create trip location', function(done){
    var trip = new Trip(originatingUser, originatingUser.products[0], servicingUser, servicingUser.products[0]);
    store
      .createTrip(trip)
      .then(function(res){
        var updates = Promise.resolve();
        for (var i = 0; i < 10; i++) {
          updates = updates.then(function(){
            return createNewLocationAndUpdate(trip)
              .then(function(res){
                verifyLocation(trip.locationUpdates, res);
              })
          });
        }
        return updates;
      })
      .then(function(){
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should create a trip payment', function(done){
    var trip = new Trip(originatingUser, originatingUser.products[0], servicingUser, servicingUser.products[0]);
    store
      .createTrip(trip)
      .then(function(res){
        res.length.should.be.equal(1);
        return store
          .createTripPayment(trip.getPaymentRequest())
          .then(function(){
            return store.getTripPaymentByTripId(trip.id);
          });
      })
      .then(function(res){
        res.length.should.be.equal(1);
        tripPaymentsShouldBeEqual(trip.payment, res[0]);
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should update a trip payment', function(done){
    var trip = new Trip(originatingUser, originatingUser.products[0], servicingUser, servicingUser.products[0]);
    store
      .createTrip(trip)
      .then(function(res){
        return store
          .createTripPayment(trip.getPaymentRequest())
          .then(function(){
            return store.updateTripPayment(trip.getConfirmedPaymentRequest())
          })
          .then(function(){
            return store.getTripPaymentByTripId(trip.id);
          });
      })
      .then(function(res){
        res.length.should.be.equal(1);
        tripPaymentsShouldBeEqual(trip.payment, res[0]);
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  after(function(done){
    resetStore(store)
      .then(function(){
        done();
      })
      .error(function(err){
        done(new Error(err))
      });
  });
});