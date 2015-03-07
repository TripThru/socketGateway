var usersController = require('../controller/users');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function callApiIfUserValid(token, request, fn) {
  var user = usersController.getByToken(request.query.token);
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

function UserRoutes() {
  
}

UserRoutes.prototype.setNetworkInfo = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, usersController.setNetworkInfo);
};

UserRoutes.prototype.getNetworkInfo = function(token, id) {
  var request = {id: id};
  return callApiIfUserValid(token, request, usersController.getNetworkInfo);
};

UserRoutes.prototype.getDriversNearby = function(token) {
  return callApiIfUserValid(token, null, usersController.getNetworkInfo);
};

module.exports = new UserRoutes();