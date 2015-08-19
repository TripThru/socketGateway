var Promise = require('bluebird');
var moment = require('moment');
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
var currencyConversion = require('../currency_conversion');

function UsersController() {
  this.gateway = null;
  this.usersById = {};
  this.usersByToken = {};
}

UsersController.prototype.getUsersFromStore = function() {
  return usersModel
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
};

UsersController.prototype.init = function(gatewayClient) {
  Interface.ensureImplements(gatewayClient, IGateway);
  this.gateway = gatewayClient;
  this.getUsersFromStore();
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

UsersController.prototype.getNetworkInfo = function(request) {
  var log = logger.getSublog(request.id);
  log.log('Get network info ' + request.client_id, request);
  var self = this;
  return validate
    .getNetworkInfoRequest(request)
    .bind(this)
    .then(function(validation){
      if(validation.valid) {
        return self._getById(request.client_id);
      } else {
        log.log('Invalid get network info received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(u){
      var name = u ? u.name : 'unknown';
      log.log('Get network info received from ' + name, request);
      return self._getById(request.id);
    })
    .then(function(u){
      if(u) {
        var response = TripThruApiFactory.createResponseFromUser(u, 'get-network-info');
        log.log('Response', response);
        return response;
      } else {
        throw new InvalidRequestError(resultCodes.notFound, 'Network ' + request.id + ' not found');
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
        return self._getById(request.client_id);
      } else {
        log.log('Invalid set network info received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(u){
      if(u) {
        this.updatedUser = TripThruApiFactory.createUserFromRequest(request,
            'set-network-info', {user: u});
        self._add(this.updatedUser);
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
      console.log(err);
      log.log('Response', response);
      return response;
    });
};

UsersController.prototype.getDriversNearby = function(request) {
  var log = logger.getSublog(request.client_id);
  log.log('Get drivers nearby ' + request.client_id, request);
  var self = this;
  return validate
    .getDriversNearbyRequest(request)
    .bind({})
    .then(function(validation){
      if(validation.valid) {
        return self.getNetworksThatServeLocation(request.location);
      } else {
        log.log('Invalid set network info received from ' + request.client_id, request);
        throw new InvalidRequestError(resultCodes.invalidParameters, validation.error.message);
      }
    })
    .then(function(networks){
      var productId = request.product_id || null;
      var coverage = {
          center: {
            lat: request.location.lat,
            lng: request.location.lng
          },
          radius: request.radius || 0.1
      };
      var promises = [];
      for(var i = 0; i < networks.length; i++) {
        var network = networks[i];
        for(var j = 0; j < network.products.length; j++) {
          var product = network.products[j];
          for (var c = 0; c < product.coverage.length; c++) {
            if((!productId || productId === product.id) &&
              maptools.isInside(request.location, product.coverage[c])) {
              request.product_id = product.id;
              promises.push(self.gateway.getDriversNearby(network.id, request));
            }
          }
        }
      }
      return Promise
        .settle(promises)
        .then(function(results){
          var drivers = [];
          for(var i = 0; i < results.length; i++) {
            if(results[i].isFulfilled()) {
              var value = results[i].value();
              if(value.result_code === resultCodes.ok && value.count > 0) {
                drivers = drivers.concat(value.drivers);
              }
            }
          }
          var response = TripThruApiFactory.createSuccessResponse();
          response.drivers = drivers;
          response.count = drivers.length;
          return response;
        });
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

UsersController.prototype.getByToken = function(token) {
  return this._getByToken(token);
};

UsersController.prototype.getById = function(id) {
  return this._getById(id);
};

UsersController.prototype.getAll = function() {
  if(Object.keys(this.usersById).length === 0) {
    return this
      .getUsersFromStore()
      .then(function(){
        return this.usersById;
      });
  }
  return Promise.resolve(this.usersById);
};

UsersController.prototype.getNetworksThatServeLocation = function(location) {
  var users = this.usersById;
  return new Promise(function(resolve, reject){
    var usersThatServeLocation = [];
    for(var id in users) {
      if(users.hasOwnProperty(id)) {
        var u = users[id];
        for(var i = 0; i < u.products.length; i++) {
          for (var c = 0; c < u.products[i].coverage.length; c++) {
            if(u.products[i].coverage[c] && maptools.isInside(location, u.products[i].coverage[c])){
              usersThatServeLocation.push(u);
            }
          }
        }
      }
    }
    resolve(usersThatServeLocation);
  });
};

UsersController.prototype.getBalance = function(userId) {
  return usersModel.getBalance(userId);
}

UsersController.prototype._fakeDeposit = function(user, currentBalance, amount) {
  return currencyConversion
    .convert(amount, 'USD', user.currencyCode)
    .bind(this)
    .then(function(depositAmount){
      var newBalance = currentBalance+depositAmount;
      return this
        .incrementBalance(user.id, depositAmount, user.currencyCode, 'deposit', moment().utc(), newBalance)
        .then(function(){
          return true;
        });
    });
};

UsersController.prototype.hasEnoughBalance = function(id, amount, currencyCode) {
  var self = this;
  return this
    ._getById(id)
    .bind({})
    .then(function(user){
      this.user = user;
      if(user.currencyCode !== currencyCode) {
        return currencyConversion.convert(amount, currencyCode, user.currencyCode)
          .then(function(convertedAmount){
            amount = convertedAmount;
          });
      }
    })
    .then(function(){
      return usersModel.getBalance(id);
    })
    .then(function(balance){
      if((balance - amount) <= 1000) {
        self._fakeDeposit(this.user, balance, 10000);
      }
      return true;
      //return balance && (balance - amount) >= 0;
    });
};

UsersController.prototype.incrementBalance = function(id, amount, currencyCode, transactionType, datetime, balance) {
  return usersModel.incrementBalance(id, amount, currencyCode, transactionType, datetime, balance);
};

UsersController.prototype.decrementBalance = function(id, amount, currencyCode, transactionType, datetime, balance) {
  return usersModel.decrementBalance(id, amount, currencyCode, transactionType, datetime, balance);
};

module.exports = new UsersController();