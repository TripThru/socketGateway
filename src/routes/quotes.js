var quotesController = require('../controller/quotes');
var usersController = require('../controller/users');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function callApiIfUserValid(token, request, fn) {
  var user = usersController.getByToken(request.query.token);
  if(user && user.role === 'partner') {
    request.client_id = user.clientId;
    return fn(request);
  } else {
    return Promise.resolve({ 
      result: 'Authentication error', 
      resultCode: resultCodes.authenticationError
    });
  }
}

function QuoteRoutes() {
  
}

QuoteRoutes.prototype.getQuote = function(token, id) {
  var request = {id: id};
  return callApiIfUserValid(token, request, quotesController.getQuote);
};

module.exports = new QuoteRoutes();