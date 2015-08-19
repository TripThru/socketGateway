var should = require('should');
var sinon = require('sinon');
var sandbox = sinon.sandbox.create();
var Promise = require('bluebird');
var redis = require('redis');
var activeTrips = require('../src/active_trips');
var store = require('../src/store/store');
var log = require('../src/logger');

stubDependencies();

var config = require('./config/controllers');
var tripsController = require('../src/controller/trips');
var quotesController = require('../src/controller/quotes');
var usersController = require('../src/controller/users');
var networksGateway = require('../src/networks_gateway');
var tripPaymentsModel = require('../src/model/trip_payments');
var resultCodes = require('../src/codes').resultCodes;
var UnsuccessfulRequestError = require('../src/errors').UnsuccessfulRequestError;

function stubDependencies() {
  sinon.stub(redis, 'createClient').returns(null);
  sinon.stub(store, 'getAllUsers').returns(Promise.resolve([]));
  sinon.stub(log, 'getSublog').returns({
    log: function(){}
  });
}

function restoreDependencies() {
  redis.createClient.restore();
  store.getAllUsers.restore();
  log.log.restore();
}

function controllerFixtures(name) {
  return require('./fixtures/controllers/' + name);
}

function modelFixtures(name) {
  return require('./fixtures/controller/models/' + name);
}

describe('Trips controller tests', function(){

  before(function(){
    tripsController.init(networksGateway);
  });

  beforeEach(function(){
    sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('originating_network')));
  });

  it('should reject malformed dispatch request', function(done){
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/dispatch_malformed'))
      .then(function(res){
        res.should.be.eql(controllerFixtures('responses/api/dispatch_got_malformed_request'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject duplicate dispatch id', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/dispatch_incoming'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.getById.calledWithExactly(controllerFixtures('requests/api/dispatch_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/dispatch_duplicate'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle valid autodispatch request', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    sandbox.stub(activeTrips, 'create').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(quotesController, 'getBestQuote').returns(Promise.resolve(controllerFixtures('responses/best_quote_found')));
    sandbox.stub(networksGateway, 'dispatchTrip').returns(Promise.resolve(controllerFixtures('responses/api/success')));
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/autodispatch_incoming'))
      .then(function(res){
        activeTrips.create.calledOnce.should.be.true;
        activeTrips.create.calledWithExactly(controllerFixtures('requests/autodispatch_create_trip')).should.be.true;
        quotesController.getBestQuote.calledOnce.should.be.true;
        quotesController.getBestQuote.calledWithExactly(controllerFixtures('requests/get_best_quote')).should.be.true;
        networksGateway.dispatchTrip.calledOnce.should.be.true;
        networksGateway.dispatchTrip.calledWithExactly(controllerFixtures('requests/api/autodispatch_outgoing')).should.be.true;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('requests/autodispatch_update_dispatched_trip')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle valid direct disptach request', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    sandbox.stub(activeTrips, 'create').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(quotesController, 'getBestQuote').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'dispatchTrip').returns(Promise.resolve(controllerFixtures('responses/api/success')));
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/dispatch_incoming'))
      .then(function(res){
        activeTrips.create.calledOnce.should.be.true;
        activeTrips.create.calledWithExactly(controllerFixtures('requests/dispatch_create_trip')).should.be.true;
        quotesController.getBestQuote.called.should.be.false;
        networksGateway.dispatchTrip.calledOnce.should.be.true;
        networksGateway.dispatchTrip.calledWithExactly(controllerFixtures('requests/api/dispatch_outgoing')).should.be.true;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('requests/dispatch_update_dispatched_trip')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject autodispatch request when no best quote', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    sandbox.stub(activeTrips, 'create').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(quotesController).returns(Promise.resolve(controllerFixtures('responses/no_best_quote')));
    sandbox.stub(networksGateway).returns(Promise.resolve());
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/autodispatch_incoming'))
      .then(function(res){networksGateway.dispatchTrip.calledOnce.should.be.false;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('requests/autodispatch_update_rejected_trip')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/autodispatch_no_best_quote'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject dispatch request to servicing network when malformed response', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    sandbox.stub(activeTrips, 'create').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'dispatchTrip').returns(Promise.resolve(controllerFixtures('responses/api/dispatch_malformed_response')));
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/dispatch_incoming'))
      .then(function(res){
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('requests/dispatch_update_rejected_trip')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/dispatch_got_outgoing_malformed'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject dispatch request when dispatch to servicing network timeouts', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    sandbox.stub(activeTrips, 'create').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'dispatchTrip').returns(Promise.resolve(new UnsuccessfulRequestError(resultCodes.unknownError, 'Timeout')));
    tripsController
      .dispatchTrip(controllerFixtures('requests/api/dispatch_incoming'))
      .then(function(res){
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('requests/dispatch_update_rejected_trip')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/dispatch_got_timeout'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject malformed get trip status request', function(done){
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_malformed'))
      .then(function(res){
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_got_malformed_request'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject get trip status when trip doesn\'t exist', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null))
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.getById.calledWithExactly(controllerFixtures('requests/api/get_trip_status_incoming_originating_network').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_not_found'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle valid get trip status request to servicing network', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(networksGateway, 'getTripStatus').returns(Promise.resolve(controllerFixtures('responses/api/get_trip_status_dispatched_success')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        networksGateway.getTripStatus.calledOnce.should.be.true;
        networksGateway.getTripStatus
          .calledWithExactly(controllerFixtures('dispatched_trip').servicingNetwork.id,
                             controllerFixtures('requests/api/get_trip_status_outgoing_originating_network')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_dispatched_success'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle valid get trip status request to servicing network', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(networksGateway, 'getTripStatus').returns(Promise.resolve(controllerFixtures('responses/api/get_trip_status_dispatched_success')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_incoming_servicing_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        networksGateway.getTripStatus.calledOnce.should.be.true;
        networksGateway.getTripStatus
          .calledWithExactly(controllerFixtures('dispatched_trip').servicingNetwork.id,
                             controllerFixtures('requests/api/get_trip_status_outgoing_servicing_network')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_dispatched_success'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should fallback to last know status when not dispatched', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('new_trip')));
    sandbox.stub(networksGateway, 'getTripStatus').returns(Promise.resolve());
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_incoming_servicing_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        networksGateway.getTripStatus.called.should.be.false;
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_new_success'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should fallback to last know status when other network timeouts', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(networksGateway, 'getTripStatus').returns(Promise.resolve(new UnsuccessfulRequestError(resultCodes.unknownError, 'Timeout')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_incoming_servicing_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        networksGateway.getTripStatus.calledOnce.should.be.true;
        networksGateway.getTripStatus
          .calledWithExactly(controllerFixtures('dispatched_trip').servicingNetwork.id,
                             controllerFixtures('requests/api/get_trip_status_outgoing_servicing_network')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_dispatched_success'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  /*
  it('should fallback to last know status when other network returns malformed response', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(networksGateway, 'getTripStatus').returns(Promise.resolve(controllerFixtures('responses/api/get_trip_status_malformed_response')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/get_trip_status_incoming_servicing_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        networksGateway.getTripStatus.calledOnce.should.be.true;
        networksGateway.getTripStatus
          .calledWithExactly(controllerFixtures('dispatched_trip').servicingNetwork.id,
                             controllerFixtures('requests/api/get_trip_status_outgoing_servicing_network')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/get_trip_status_dispatched_success'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });
  */

  it('should reject malformed update trip status request', function(done){
    tripsController
      .updateTripStatus(controllerFixtures('requests/api/update_trip_status_malformed'))
      .then(function(res){
        res.should.be.eql(controllerFixtures('responses/api/update_trip_status_got_malformed_request'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject update trip status request when trip doesn\'t exist', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.getById.calledWithExactly(controllerFixtures('requests/api/update_trip_status_incoming_originating_network').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/update_trip_status_not_found'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject update trip status request when trip is in completed status', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('completed_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve());
    tripsController
      .getTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.called.should.be.false;
        networksGateway.updateTripStatus.called.should.be.false;
        res.should.be.eql(controllerFixtures('responses/api/update_trip_status_trip_is_terminated'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject update trip status request when trip is in cancelled status', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('cancelled_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve());
    tripsController
      .getTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network_request'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.called.should.be.false;
        networksGateway.updateTripStatus.called.should.be.false;
        res.should.be.eql(controllerFixtures('responses/api/update_trip_status_trip_is_terminated'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject update trip status request when trip is in rejected status', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('rejected_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve());
    tripsController
      .getTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.called.should.be.false;
        networksGateway.updateTripStatus.called.should.be.false;
        res.should.be.eql(controllerFixtures('responses/api/update_trip_status_trip_terminated_response'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle update trip status request when other network timeouts', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve(new UnsuccessfulRequestError(resultCodes.unknownError, 'Timeout')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network_request'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('updated_trip')).should.be.true;
        networksGateway.updateTripStatus.called.should.be.true;
        networksGateway
          .updateTripStatus.calledWithExactly(
            controllerFixtures('dispatched_trip').servicingNetwork.id,
            controllerFixtures('requests/api/update_trip_status_outgoing_originating_network')
            ).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/update_trip_status_trip_got_timeout'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  /*
  it('should handle update trip status when network returns malformed response', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve(controllerFixtures('responses/api/update_trip_status_malformed_response')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('updated_trip')).should.be.true;
        networksGateway.updateTripStatus.called.should.be.true;
        networksGateway
          .updateTripStatus.calledWithExactly(
            controllerFixtures('dispatched_trip').servicingNetwork.id,
            controllerFixtures('requests/api/update_trip_status_outgoing_originating_network')
            ).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });
  */

  it('should handle valid update trip status request from originating network to servicing network', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve(controllerFixtures('responses/api/success')));
    tripsController
      .updateTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_servicing_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('updated_trip')).should.be.true;
        networksGateway.updateTripStatus.called.should.be.true;
        networksGateway
          .updateTripStatus.calledWithExactly(
            controllerFixtures('dispatched_trip').servicingNetwork.id,
            controllerFixtures('requests/api/update_trip_status_outgoing_servicing_network')
            ).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle valid update trip status request from servicing network to originating network', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    sandbox.stub(activeTrips, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'updateTripStatus').returns(Promise.resolve(controllerFixtures('requests/api/success')));
    tripsController
      .updateTripStatus(controllerFixtures('requests/api/update_trip_status_incoming_originating_network'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.update.calledOnce.should.be.true;
        activeTrips.update.calledWithExactly(controllerFixtures('updated_trip')).should.be.true;
        networksGateway.updateTripStatus.called.should.be.true;
        networksGateway
          .updateTripStatus.calledWithExactly(
            controllerFixtures('dispatched_trip').user.id,
            controllerFixtures('requests/api/update_trip_status_outgoing_originating_network')
            ).should.be.true;
        res.should.be.eql(controllerFixtures('success_response'));
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  /*
  it('should reject update trip status request from originating network if it includes other than status', function(done){

  });
  */

  it('should reject malformed payment request', function(done){
    tripsController
      .requestPayment(controllerFixtures('requests/api/request_payment_malformed'))
      .then(function(res){
        res.should.be.eql(controllerFixtures('responses/api/request_payment_got_malformed_request'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject payment request when trip doesn\'t exist', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(null));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.getById.calledWithExactly(controllerFixtures('requests/api/request_payment_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/request_payment_not_found'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject payment request when trip is not completed', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('dispatched_trip')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        activeTrips.getById.calledOnce.should.be.true;
        activeTrips.getById.calledWithExactly(controllerFixtures('requests/api/request_payment_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/request_payment_trip_not_complete'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject duplicate payment request', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('completed_trip')));
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(controllerFixtures('trip_payment_unconfirmed')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/request_payment_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/request_payment_already_exists'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject payment request not coming from servicing network', function(done){
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('completed_trip')));
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(null));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        res.should.be.eql(controllerFixtures('response/api/request_payment_not_allowed'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject payment request when originating network timeouts', function(done){
    sandbox.stub(activeTrips, 'add').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('completed_trip')));
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(null));
    sandbox.stub(networksGateway, 'requestPayment').returns(Promise.resolve(new UnsuccessfulRequestError(resultCodes.unknownError, 'Timeout')));
    usersController.getById.restore();
    sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('servicing_network')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        activeTrips.add.called.should.be.false;
        networksGateway.requestPayment.calledOnce.should.be.true;
        networksGateway.requestPayment.calledWithExactly(
          controllerFixtures('completed_trip').id,
          controllerFixtures('requests/api/request_payment_outgoing')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/request_payment_got_timeout_response'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      })
      .finally(function(){
        usersController.getById.restore();
        sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('originating_network')));
      });
  });

  /*
  it('should reject payment request when originating network returns malformed response', function(done){
    sandbox.stub(activeTrips, 'add').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('completed_trip')));
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(null));
    sandbox.stub(networksGateway, 'requestPayment').returns(Promise.resolve(controllerFixtures('responses/api/request_payment_malformed_response')));
    usersController.getById.restore();
    sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('servicing_network')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        activeTrips.add.called.should.be.false;
        networksGateway.requestPayment.calledOnce.should.be.true;
        networksGateway.requestPayment.calledWithExactly(
          controllerFixtures('completed_trip').id,
          controllerFixtures('requests/api/request_payment_outgoing')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/request_payment_got_malformed_response'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      })
      .finally(function(){
        usersController.getById.restore();
        sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('originating_network')));
      });
  });
  */

  it('should handle valid payment request', function(done){
    sandbox.stub(activeTrips, 'add').returns(Promise.resolve());
    sandbox.stub(activeTrips, 'getById').returns(Promise.resolve(controllerFixtures('completed_trip')));
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(null));
    sandbox.stub(networksGateway, 'requestPayment').returns(Promise.resolve(controllerFixtures('responses/api/success')));
    usersController.getById.restore();
    sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('servicing_network')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/request_payment_incoming'))
      .then(function(res){
        activeTrips.add.calledOnce.should.be.true;
        activeTrips.add.calledWithExactly(controllerFixtures('trip_payment_unconfirmed')).should.be.true;
        networksGateway.requestPayment.calledOnce.should.be.true;
        networksGateway.requestPayment.calledWithExactly(
          controllerFixtures('completed_trip').id,
          controllerFixtures('requests/api/request_payment_outgoing')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      })
      .finally(function(){
        usersController.getById.restore();
        sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('originating_network')));
      });
  });

  it('should reject malformed accept payment request', function(done){
    tripsController
      .requestPayment(controllerFixtures('requests/api/accept_payment_malformed'))
      .then(function(res){
        res.should.be.eql(controllerFixtures('responses/api/accept_payment_got_malformed_request'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject accept payment request when payment request doesn\'t exist', function(done){
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(null));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/accept_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/accept_payment_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/accept_payment_not_found'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject duplicate accept payment request', function(done){
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(controllerFixtures('trip_payment_confirmed')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/accept_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/accept_payment_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/accept_payment_already_confirmed'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should reject accept payment request not coming from originating network', function(done){
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(controllerFixtures('trip_payment_unconfirmed')));
    usersController.getById.restore();
    sandbox.stub(usersController, 'getById').returns(Promise.resolve(controllerFixtures('servicing_network')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/accept_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/accept_payment_incoming').id).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/accept_payment_not_allowed'));
        done();
      })
      .error(function(error){
        usersController.getById.restore();
        done(new Error(error));
      });
  });

  it('should handle valid accept payment request', function(done){
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(controllerFixtures('trip_payment_unconfirmed')));
    sandbox.stub(tripPaymentsModel, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'acceptPayment').returns(Promise.resolve(controllerFixtures('responses/api/success')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/accept_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/accept_payment_incoming').id).should.be.true;
        tripPaymentsModel.update.calledOnce.should.be.true;
        tripPaymentsModel.update.calledWithExactly(controllerFixtures('trip_payment_confirmed')).should.be.true;
        networksGateway.acceptPayment.calledOnce.should.be.true;
        networksGateway.acceptPayment.calledWithExactly(controllerFixtures('requests/api/accept_payment_outgoing')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  it('should handle accept payment request when servicing network timeouts', function(done){
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(controllerFixtures('trip_payment_unconfirmed')));
    sandbox.stub(tripPaymentsModel, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'acceptPayment').returns(Promise.resolve(new UnsuccessfulRequestError(resultCodes.unknownError, 'Timeout')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/accept_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/accept_payment_incoming').id).should.be.true;
        tripPaymentsModel.update.calledOnce.should.be.true;
        tripPaymentsModel.update.calledWithExactly(controllerFixtures('trip_payment_confirmed')).should.be.true;
        networksGateway.acceptPayment.calledOnce.should.be.true;
        networksGateway.acceptPayment.calledWithExactly(controllerFixtures('requests/api/accept_payment_outgoing')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });

  /*
  it('should handle accept payment request when servicing network returns malformed response', function(done){
    sandbox.stub(tripPaymentsModel, 'getById').returns(Promise.resolve(controllerFixtures('trip_payment_unconfirmed')));
    sandbox.stub(tripPaymentsModel, 'update').returns(Promise.resolve());
    sandbox.stub(networksGateway, 'acceptPayment').returns(Promise.resolve(controllerFixtures('responses/api/accept_payment_malformed_response')));
    tripsController
      .getTripStatus(controllerFixtures('requests/api/accept_payment_incoming'))
      .then(function(res){
        tripPaymentsModel.getById.calledOnce.should.be.true;
        tripPaymentsModel.getById.calledWithExactly(controllerFixtures('requests/api/accept_payment_incoming').id).should.be.true;
        tripPaymentsModel.update.calledOnce.should.be.true;
        tripPaymentsModel.update.calledWithExactly(controllerFixtures('trip_payment_confirmed')).should.be.true;
        networksGateway.acceptPayment.calledOnce.should.be.true;
        networksGateway.acceptPayment.calledWithExactly(controllerFixtures('requests/api/accept_payment_outgoing')).should.be.true;
        res.should.be.eql(controllerFixtures('responses/api/success'));
        done();
      })
      .error(function(error){
        done(new Error(error));
      });
  });
  */

  afterEach(function(){
    sandbox.restore();
  });

  after(function(){
    restoreDependencies();
  });

});

