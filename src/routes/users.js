var usersController = require('../controller/users');
var codes = require('../codes');
var resultCodes = codes.resultCodes;

function callApiIfUserValid(token, request, fn) {
  var user = usersController.getByToken(req.query.token);
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

function UserRoutes() {
  
}

UserRoutes.prototype.setPartnerInfo = function(token, id, request) {
  request.id = id;
  return callApiIfUserValid(token, request, usersController.setPartnerInfo);
};

UserRoutes.prototype.getPartnerInfo = function(token, id) {
  var request = {id: id};
  return callApiIfUserValid(token, request, usersController.getPartnerInfo);
};

module.exports = new UserRoutes();