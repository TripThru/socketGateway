var quotesController = require('../controller/quotes');
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
        return fn.call(quotesController, request);
      } else {
        return Promise.resolve({
          result: 'Authentication error',
          result_code: resultCodes.authenticationError
        });
      }
    });
}

function QuoteRoutes() {

}

QuoteRoutes.prototype.getQuote = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, quotesController.getQuote);
};

module.exports = new QuoteRoutes();