var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var usersModel = require('../model/users');
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
  this.usersById = {};
  this.usersByToken = {};
  usersModel
    .getAll()
    .bind(this)
    .then(function(allUsers){
      for(var i = 0; i < allUsers.length; i++) {
        this._add(allUsers[i]);
      }
    });
}

UsersController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.socket = gatewayClient;
};

UsersController.prototype._getById = function(id) {
  if(this.usersById.hasOwnProperty(id)) {
    return Promise.resolve(this.usersById[id]);
  } else {
    return usersModel
      .getById(id)
      .bind(this)
      .then(function(user){
        if(user) {
          this._add(user);
        }
        return user;
      });
  }
};

UsersController.prototype._getByToken = function(token) {
  if(this.usersByToken.hasOwnProperty(token)) {
    return Promise.resolve(this.usersByToken[token]);
  } else {
    return usersModel
      .getByToken(token)
      .bind(this)
      .then(function(user){
        if(user) {
          this._add(user);
        }
        return user;
      });
  }
};

UsersController.prototype._add = function(user) {
  this.usersById[user.id] = user;
  this.usersByToken[user.token] = user;
};

UsersController.prototype.getPartnerInfo = function(request) {
  var log = logger.getSublog(request.id);
  log.log('Get partner info ' + request.id + ' from ' + request.clientId, request);
  var user = TripThruApiFactory.createUserFromRequest(request, 'get-partner-info');
  return this
    ._getById(user.id)
    .bind(this)
    .then(function(u){
      if(u) {
        var response = TripThruApiFactory.createResponseFromUser(u, 'get-partner-info');
        log.log('Response', response);
        return response;
      } else {
        throw new RequestError(resultCodes.notFound, 'User ' + request.id + ' does not exist');
      }
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

UsersController.prototype.setPartnerInfo = function(request) {
  var log = logger.getSublog(request.clientId);
  log.log('Set partner info ' + request.clientId, request);
  return this
    ._getById(request.clientId)
    .bind({})
    .then(function(u){
      if(u) {
        this.updatedUser = TripThruApiFactory.createUserFromRequest(request, 
            'set-partner-info', {user: u});
        return usersModel.update(this.updatedUser);
      } else {
        throw new RequestError(resultCodes.notFound, 'User ' + request.clientId + ' does not exist');
      }
    })
    .then(function(){
      var response = 
        TripThruApiFactory.createResponseFromUser(this.updatedUser, 'set-partner-info');
      log.log('Response', response);
      return response;
    })
    .catch(RequestError, function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          err.resultCode, err.error);
      log.log('Response', response);
      return response;
    })
    .error(function(err){
      var response = TripThruApiFactory.createResponseFromUser(null, null, 
          resultCodes.unknownError, 'unknown error ocurred');
      log.log('Response', response);
      return response;
    });
};

UsersController.prototype.getByToken = function(token) {
  return this._getByToken(token);
};

UsersController.prototype.getById = function(id) {
  return this._getById(id);
};

UsersController.prototype.getAll = function() {
  var users = this.usersById;
  return new Promise(function(resolve, reject){
    var result = [];
    for(var id in users) {
      if(users.hasOwnProperty(id)) {
        result.push(users[id]);
      }
    }
    resolve(result);
  });
};

UsersController.prototype.getPartnersThatServeLocation = function(location) {
  var users = this.usersById;
  return new Promise(function(resolve, reject){
    var usersThatServeLocation = [];
    for(var id in users) {
      if(users.hasOwnProperty(id)) {
        var u = users[id];
        for(var j = 0; j < u.coverage.length; j++) {
          var coverage = u.coverage[j];
          if(maptools.isInside(location, coverage)){
            usersThatServeLocation.push(u);
          }
        }
      }
    }
    resolve(usersThatServeLocation);
  });
};

module.exports = new UsersController();