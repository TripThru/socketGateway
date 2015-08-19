var config = require('./config');
var Promise = require('bluebird');
var moment = require('moment');
var store = require('./src/store/store');
store.init(config.db);

store
  .raw('SET FOREIGN_KEY_CHECKS=0')
  .then(function(){
    return store.raw('truncate currency_rates');
  })
  .then(function(){
    return store.raw('truncate user_transactions');
  })
  .then(function(){
    return store.raw('truncate trip_locations');
  })
  .then(function(){
    return store.raw('truncate trip_payment');
  })
  .then(function(){
    return store.raw('truncate trips');
  })
  .then(function(){
    return store.raw('truncate aggregated_trip_payments_detailed_daily');
  })
  .then(function(){
    return store.raw('truncate aggregated_trip_payments_total_daily');
  })
  .then(function(){
    return store.raw("update users set balance = 0 where users.role = 'network' and users.id");
  })
  .then(function(){
    return store.raw('SET FOREIGN_KEY_CHECKS=0');
  })
  .then(function(){
    process.exit();
  });