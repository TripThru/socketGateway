var Promise = require('bluebird');
var TripThruApiFactory = require('../tripthru_api_factory');
var Gateway = require('../gateway').Gateway;
var IGateway = require('../gateway').IGateway;
var Interface = require('../interface').Interface;
var usersModel = require('../model/users');
var maptools = require('../map_tools').MapTools;
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var validate = require('./validate');
var logger = require('../logger');
var InvalidRequestError = require('../errors').InvalidRequestError;
var UnsuccessfulRequestError = require('../errors').UnsuccessfulRequestError;

function UsersController() {
  this.gateway = null;
  this.usersById = {};
  this.usersByToken = {};
  usersModel
    .getAll()
    .bind(this)
    .then(function(allUsers){
      for(var i = 0; i < allUsers.length; i++) {
        this._add(allUsers[i]);
      }
    })
    .error(function(err){
      logger.getSublog().log('init', err);
    });
}

UsersController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.gateway = gatewayClient;
};

UsersController.prototype._getByClientId = function(id) {
  if(this.usersById.hasOwnProperty(id)) {
    return Promise.resolve(this.usersById[id]);
  } else {
    return usersModel
      .getByClientId(id)
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
  this.usersById[user.clientId] = user;
  this.usersByToken[user.token] = user;
};

UsersController.prototype.getNetworkInfo = function(request) {
  var log = logger.getSublog(request.id);
  var self = this;
  return validate
    .getNetworkInfoRequest(request)
    .bind(this)
    .then(function(validation){
      if(validation.valid) {
        return self._getByClientId(request.client_id);
      } else {
        log.log('Invalid get network info received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(u){
      var name = u ? u.fullname : 'unknown';
      log.log('Get network info received from ' + name, request);
      if(u) {
        var response = TripThruApiFactory.createResponseFromUser(u, 'get-network-info');
        log.log('Response', response);
        return response;
      } else {
        throw new InvalidRequestError(resultCodes.notFound, 'User ' + request.id + ' does not exist');
      }
    })
    .catch(InvalidRequestError, function(err){
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

UsersController.prototype.setNetworkInfo = function(request) {
  var log = logger.getSublog(request.client_id);
  log.log('Set network info ' + request.client_id, request);
  var self = this;
  return validate
    .setNetworkInfoRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return self._getByClientId(request.client_id);
      } else {
        log.log('Invalid set network info received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(u){
      if(u) {
        this.updatedUser = TripThruApiFactory.createUserFromRequest(request, 
            'set-network-info', {user: u});
        return usersModel.update(this.updatedUser);
      } else {
        throw new InvalidRequestError(resultCodes.notFound, 'User ' + request.client_id + ' does not exist');
      }
    })
    .then(function(){
      var response = 
        TripThruApiFactory.createResponseFromUser(this.updatedUser, 'set-network-info');
      log.log('Response', response);
      return response;
    })
    .catch(InvalidRequestError, function(err){
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

UsersController.prototype.getDriversNearby = function(request) {
  throw new Error('Not implemented');
};

UsersController.prototype.getByToken = function(token) {
  return this._getByToken(token);
};

UsersController.prototype.getByClientId = function(id) {
  return this._getByClientId(id);
};

UsersController.prototype.getAll = function() {
  var users = this.usersById;
  return new Promise(function(resolve, reject){
    var result = Object.keys(users).map(function(id) {
      return users[id];
    });
    resolve(result);
  });
};

UsersController.prototype.getNetworksThatServeLocation = function(location) {
  var users = this.usersById;
  return new Promise(function(resolve, reject){
    var usersThatServeLocation = [];
    for(var id in users) {
      if(users.hasOwnProperty(id)) {
        var u = users[id];
        for(var i = 0; i < u.products.length; i++) {
          if(maptools.isInside(location, u.products[i].coverage)){
            usersThatServeLocation.push(u);
          }
        }
      }
    }
    resolve(usersThatServeLocation);
  });
};

module.exports = new UsersController();