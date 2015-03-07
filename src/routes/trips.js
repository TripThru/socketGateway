var tripsController = require('../controller/trips');
var usersController = require('../controller/users');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function callApiIfUserValid(token, request, fn) {
  var user = usersController.getByToken(token);
  if(user && user.role === 'network') {
    request.client_id = user.clientId;
    return fn(request);
  } else {
    return Promise.resolve({ 
      result: 'Authentication error', 
      resultCode: resultCodes.authenticationError
    });
  }
}

function TripRoutes() {
  
}

TripRoutes.prototype.dispatchTrip = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, tripsController.dispatchTrip);
};

TripRoutes.prototype.updateTripStatus = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, tripsController.updateTripStatus);
};

TripRoutes.prototype.getTripStatus = function(token, id) {
  return usersController
    .getByToken(token)
    .then(function(user){
      if(user) {
        var request = {
          client_id: user.clientId,
          id: id
        };
        return tripsController.getTripStatus(request);
      } else {
        return { 
          result: 'Authentication error', 
          result_code: resultCodes.authenticationError
        };
      }
    });
};

module.exports = new TripRoutes();