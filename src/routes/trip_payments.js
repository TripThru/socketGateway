var tripPaymentsController = require('../controller/trip_payments');
var usersController = require('../controller/users');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var Promise = require('bluebird');

function callApiIfUserValid(token, request, fn) {
  return usersController
    .getByToken(token)
    .then(function(user){
      if(user && user.role === 'network') {
        request.client_id = user.id;
        return fn.call(tripPaymentsController, request);
      } else {
        return Promise.resolve({
          result: 'Authentication error',
          result_code: resultCodes.authenticationError
        });
      }
    });
}

function TripPaymentRoutes() {

}

TripPaymentRoutes.prototype.requestPayment = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, tripPaymentsController.requestPayment);
};

TripPaymentRoutes.prototype.acceptPayment = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, tripPaymentsController.acceptPayment);
};

module.exports = new TripPaymentRoutes();