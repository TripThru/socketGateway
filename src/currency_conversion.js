var Promise = require('bluebird');
var request = require('request');
var moment = require('moment');
var store = require('./store/store');
var resultCodes = require('./codes').resultCodes;
var UnsuccessfulRequestError = require('./errors').UnsuccessfulRequestError;

function CurrencyCloud() {
  this.apiKey = '02d10639325bf49bd7d8bb1eeff04f4eb9c043bff60ddba48febd06ec5ae476b';
  this.loginId = 'daniel.montes@tripthru.com';
  this.authToken = null;
  this.conversionMatrix = {};
  this.refreshedAuthTokenPromise;
  this.refreshedTokenAt;
}

CurrencyCloud.prototype.init = function() {
  var self = this;
  return store
    .getCurrencyRates(moment().utc().startOf('day').format().toString(),
                      moment().utc().endOf('day').format().toString())
    .then(function(rates){
      for (var i = 0; i < rates.length; i++) {
        (function(rate){
          if(!self.conversionMatrix.hasOwnProperty(rate.sell_currency_code)) {
            self.conversionMatrix[rate.sell_currency_code] = {};
          }
          self.conversionMatrix[rate.sell_currency_code][rate.buy_currency_code] = {
            rate: rate.rate,
            datetime: moment(rate.datetime)
          };
        })(rates[i]);
      }
    });
};

CurrencyCloud.prototype.getAuthToken = function(loginId, apiKey) {
  return new Promise(function(resolve, reject){
    request({
      url: 'https://devapi.thecurrencycloud.com/v2/authenticate/api',
      method: 'POST',
      timeout: 60000,
      followRedirect: true,
      maxRedirects: 10,
      form:{
        api_key: apiKey,
        login_id: loginId
      }
    }, function(error, response, body){
      if(error) {
        reject(new UnsuccessfulRequestError(resultCodes.unknownError, error));
      } else {
        body = JSON.parse(body);
        resolve(body.auth_token);
      }
    });
  });
};

CurrencyCloud.prototype.refreshAuthToken = function() {
  if(!this.refreshedTokenAt || moment().isAfter(this.refreshedTokenAt.add(1, 'minutes'))) {
    this.refreshedTokenAt = moment();
    this.refreshedAuthTokenPromise = this
                                      .getAuthToken(this.loginId, this.apiKey)
                                      .bind(this)
                                      .then(function(token){
                                        this.authToken = token;
                                      });
  }
  return this.refreshedAuthTokenPromise;
}

CurrencyCloud.prototype.getConversion = function(from, to) {
  var self = this;
  return this
    .refreshAuthToken()
    .then(function(){
      return new Promise(function(resolve, reject){
        request({
          url: 'https://devapi.thecurrencycloud.com/v2/conversions/create',
          headers: {
            'X-Auth-Token': self.authToken
          },
          method: 'POST',
          timeout: 60000,
          followRedirect: true,
          maxRedirects: 10,
          form:{
            sell_currency: from,
            buy_currency: to,
            amount: 1000,
            fixed_side: 'buy',
            reason: 'testing',
            term_agreement: true
          }
        }, function(error, response, body){
          if(error) {
            reject(new UnsuccessfulRequestError(resultCodes.unknownError, error));
          } else {
            body = JSON.parse(body);
            if(body.error_code) {
              reject(new UnsuccessfulRequestError(resultCodes.unknownError, body.error));
            } else {
              resolve({
                rate: body.client_buy_amount / body.client_sell_amount
              });
            }
          }
        });
      });
  });
};

CurrencyCloud.prototype.convert = function(amount, from, to) {
  if(from === to){
    return Promise.resolve(amount);
  }
  if(!this.conversionMatrix.hasOwnProperty(from)) {
    this.conversionMatrix[from] = {};
  }
  if(!this.conversionMatrix[from].hasOwnProperty(to)) {
    this.conversionMatrix[from][to] = {
      rate: null,
      datetime: null
    };
  }

  var promiseToConvert = Promise.resolve();
  var lastUpdate = this.conversionMatrix[from][to].datetime;
  if(!lastUpdate || !moment().utc().isSame(lastUpdate, 'day')) {
    this.conversionMatrix[from][to].datetime = moment().utc();
    promiseToConvert = this
      .getConversion(from, to)
      .bind(this)
      .then(function(conversion){
        this.conversionMatrix[from][to].rate = conversion.rate;
        return store.createCurrencyRate(from, to, conversion.rate, moment().utc().format().toString());
      });
  }

  return promiseToConvert
    .bind(this)
    .then(function(){
      return amount * this.conversionMatrix[from][to].rate;
    });
};

module.exports = new CurrencyCloud();