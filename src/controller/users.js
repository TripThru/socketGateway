var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var users = require('../model/users');
var maptools = require('../map_tools').MapTools;
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var logger = require('../logger');

function RequestError(resultCode, error) {
  this.resultCode = resultCode;
  this.error = error;
  Error.captureStackTrace(this, RequestError);
}
RequestError.prototype = Object.create(Error.prototype);
RequestError.prototype.constructor = RequestError;

function UsersController() {
  this.socket = null;
}

UsersController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.socket = gatewayClient;
};

UsersController.prototype.getPartnerInfo = function(request, cb) {
  var log = logger.getSublog(request.id);
  log.log('Get partner info ' + request.id + ' from ' + request.clientId, request);
  var user = TripThruApiFactory.createUserFromRequest(request, 'get-partner-info');
  users
    .getById(user.id)
    .then(function(u){
      if(u) {
        var response = TripThruApiFactory.createResponseFromUser(u, 'get-partner-info');
        log.log('Response', response);
        cb(response);
      } else {
        throw new RequestError(resultCodes.notFound, 'User ' + request.id + ' does not exist');
      }
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      cb(response);
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      cb(response);
    });
};

UsersController.prototype.setPartnerInfo = function(request, cb) {
  var log = logger.getSublog(request.clientId);
  log.log('Set partner info ' + request.clientId, request);
  users
    .getById(request.clientId)
    .bind({})
    .then(function(u){
      if(u) {
        this.updatedUser = 
          TripThruApiFactory.createUserFromRequest(request, 'set-partner-info', 
              {user: u});
        return users.update(this.updatedUser);
      } else {
        throw new RequestError(resultCodes.notFound, 'User ' + request.clientId + ' does not exist');
      }
    })
    .then(function(){
      var response = 
        TripThruApiFactory.createResponseFromUser(this.updatedUser, 'set-partner-info');
      log.log('Response', response);
      cb(response);
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      cb(response);
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      cb(response);
    });
};

UsersController.prototype.getByToken = function(token) {
  return users.getByToken(token);
};


// This is a temporary solution to work with the current website without changes
UsersController.prototype.getNetworks = function(cb) {
  users
    .getAll()
    .then(function(allUsers){
      var response = {
        fleets: [],
        vehicleTypes: []
      };
      for(var i = 0; i < allUsers.length; i++) {
        var u = allUsers[i];
        response.fleets.push({
          id: u.fleets[0].id,
          name: u.fleets[0].name,
          coverage: u.coverage,
          partner: { id: u.id, name: u.fleets[0].name }
        });
        for(var j = 0; j < u.vehicleTypes.length; j++) {
          response.vehicleTypes.push(u.vehicleTypes[j]);
        }
      }
      cb(response);
    });
};

UsersController.prototype.getPartnersThatServeLocation = function(location) {
  return users
    .getAll()
    .then(function(allUsers){
      var usersThatServeLocation = [];
      for(var i = 0; i < allUsers.length; i++) {
        var u = allUsers[i];
        for(var j = 0; j < u.coverage.length; j++) {
          var coverage = u.coverage[j].toObject();
          if(maptools.isInside(location, coverage)){
            usersThatServeLocation.push(u);
          }
        }
      }
      return usersThatServeLocation;
    });
};

module.exports = new UsersController();