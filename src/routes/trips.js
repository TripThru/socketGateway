var tripsController = require('../controller/trips');
var usersController = require('../controller/users');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function callApiIfUserValid(token, request, fn) {
  var user = usersController.getByToken(token);
  if(user && user.role === 'partner') {
    request.clientId = user.id;
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
  var user = usersController.getByToken(token);
  if(user) {
    var request = {
      clientId: user.id,
      id: id
    };
    return tripsController.getTripStatus(request);
  } else {
    return Promise.resolve({ 
      result: 'Authentication error', 
      resultCode: resultCodes.authenticationError
    });
  }
};

module.exports = new TripRoutes();