var usersController = require('../controller/users');
var networksGateway = require('../networks_gateway');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var Promise = require('bluebird');

function callApiIfUserValid(token, request, fn) {
  return usersController
    .getByToken(token)
    .then(function(user){
      if(user && user.role === 'network') {
        request.client_id = user.clientId;
        return fn.call(usersController, request);
      } else {
        return Promise.resolve({ 
          result: 'Authentication error', 
          result_code: resultCodes.authenticationError
        });
      }
    });
}

function UserRoutes() {
  
}

UserRoutes.prototype.setNetworkInfo = function(token, request) {
  return callApiIfUserValid(token, request, usersController.setNetworkInfo)
    .then(function(response){
      if(request.callback_url && response.result_code === resultCodes.ok) {
        return usersController
          .getByToken(token)
          .then(function(user){
            networksGateway.updateRestfulGateway(user);
            return response;
          });
      } else {
        return response;
      }
    });
};

UserRoutes.prototype.getNetworkInfo = function(token, id) {
  var request = {id: id};
  return callApiIfUserValid(token, request, usersController.getNetworkInfo);
};

UserRoutes.prototype.getDriversNearby = function(token, request) {
  return callApiIfUserValid(token, request, usersController.getDriversNearby);
};

module.exports = new UserRoutes();