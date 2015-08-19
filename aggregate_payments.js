var config = require('./config');
var Promise = require('bluebird');
var moment = require('moment');
var store = require('./src/store/store');
var currencyConversion = require('./src/currency_conversion');
store.init(config.db);

function getStoreAmountsByUserByDateByCurrency(userField, amountField, currencyCodeField) {
  return store
    .db('trip_payment')
    .where('processed', 0)
    .andWhereRaw('confirmed_at is not null')
    .select(
      store.raw('MAX(trip_payment.id) as max_id'),
      store.raw("concat(YEAR(trip_payment.requested_at), '-', MONTH(trip_payment.requested_at), '-', DAY(trip_payment.requested_at)) as date"),
      store.raw('(SELECT ' + userField + ' from trips where id = trip_payment.trip_id) as user_id'),
      store.raw('SUM(' + amountField + ') as amount'),
      store.raw('(SELECT name FROM currency_codes WHERE id = trip_payment.' + currencyCodeField + ') as currency_code')
    )
    .groupBy(
      'user_id',
      'date',
      'currency_code'
    );
}

function createDetailedAggregation(transaction, userId, amountByDateByCurrencyCode, isFarmedIn) {
  var createOrUpdatePromises = [];
  for(var date in amountByDateByCurrencyCode) {
    for(var currency in amountByDateByCurrencyCode[date]) {
      (function(date, currency){
        createOrUpdatePromises.push(
          store
            .db('aggregated_trip_payments_detailed_daily')
            .where('user_id', userId)
            .andWhere('datetime', date)
            .andWhereRaw('currency_code_id = (SELECT id FROM currency_codes WHERE name = ?)', [currency])
            .andWhere('is_farmed_in', isFarmedIn)
            .select('id', 'amount')
            .then(function(res){
              if(res.length > 0) {
                return store
                  .db('aggregated_trip_payments_detailed_daily')
                  .update({
                    amount: res[0].amount + amountByDateByCurrencyCode[date][currency]
                  })
                  .where('id', res[0].id)
                  .transacting(transaction);
              } else {
                return store
                  .db('aggregated_trip_payments_detailed_daily')
                  .insert({
                    user_id: userId,
                    amount: amountByDateByCurrencyCode[date][currency],
                    datetime: date,
                    currency_code_id: store.raw('(SELECT id FROM currency_codes WHERE name = ?)', [currency]),
                    is_farmed_in: isFarmedIn
                  })
                  .transacting(transaction);
              }
            })
        );
      })(date, currency);
    }
  }
  if(createOrUpdatePromises.length > 0) {
    return Promise.all(createOrUpdatePromises);
  } else {
    return Promise.resolve();
  }
}

function createTotalAggregation(transaction, userId, totalsByDate) {
  var createOrUpdatePromises = [];
  for(var date in totalsByDate) {
    (function(date){
      createOrUpdatePromises.push(
        store
          .db('aggregated_trip_payments_total_daily')
          .where('user_id', userId)
          .andWhere('datetime', date)
          .andWhereRaw('currency_code_id = (SELECT currency_code_id FROM users WHERE id = ?)', [userId])
          .select('id', 'farmed_in_amount', 'farmed_out_amount')
          .then(function(res){
            if(res.length > 0) {
              return store
                .db('aggregated_trip_payments_total_daily')
                .update({
                  farmed_in_amount: res[0].farmed_in_amount + totalsByDate[date].farmedIn,
                  farmed_out_amount: res[0].farmed_out_amount + totalsByDate[date].farmedOut
                })
                .where('id', res[0].id)
                .transacting(transaction);
            } else {
              return store
                .db('aggregated_trip_payments_total_daily')
                .insert({
                  user_id: userId,
                  farmed_in_amount: totalsByDate[date].farmedIn,
                  farmed_out_amount: totalsByDate[date].farmedOut,
                  datetime: date,
                  currency_code_id: store.raw('(SELECT currency_code_id FROM users WHERE id = ?)', [userId])
                })
                .transacting(transaction);
            }
          })
      );
    })(date);
  }
  if(createOrUpdatePromises.length > 0) {
    return Promise.all(createOrUpdatePromises);
  } else {
    return Promise.resolve();
  }
}

function markAsProcessed(transaction, lastProcessedTripPaymentId) {
  return store
    .db('trip_payment')
    .update({
      processed: 1
    })
    .where('processed', 0)
    .andWhere('id', '<=', lastProcessedTripPaymentId)
    .andWhereRaw('confirmed_at is not null')
    .transacting(transaction);
}

function getCurrencyRates(date) {
  return store
    .getCurrencyRates(moment(date, 'YYYY-MM-DD').startOf('day').format().toString(), moment(date, 'YYYY-MM-DD').endOf('day').format().toString())
    .then(function(rates){
      var conversionMatrix = {};
      for (var i = 0; i < rates.length; i++) {
        (function(rate){
          if(!conversionMatrix.hasOwnProperty(rate.sell_currency_code)) {
            conversionMatrix[rate.sell_currency_code] = {};
          }
          conversionMatrix[rate.sell_currency_code][rate.buy_currency_code] = {
            rate: rate.rate,
            datetime: moment(rate.datetime)
          };
        })(rates[i]);
      }
      return conversionMatrix;
    });
}

function getAmountsByUserByDateByCurrency(type) {
  var getAmounts;
  if(type === 'farmed-in') {
    getAmounts = Promise.all([
      getStoreAmountsByUserByDateByCurrency('servicing_network_id', 'amount', 'currency_code_id'),
      getStoreAmountsByUserByDateByCurrency('servicing_network_id', 'tip', 'tip_currency_code_id')
    ]);
  } else if(type === 'farmed-out') {
    getAmounts = Promise.all([
      getStoreAmountsByUserByDateByCurrency('user_id', 'amount', 'currency_code_id'),
      getStoreAmountsByUserByDateByCurrency('user_id', 'tip', 'tip_currency_code_id')
    ]);
  } else {
    throw new Error('Unknown amount type');
  }
  return getAmounts
    .then(function(results){
      var fares = results[0];
      var tips = results[1];
      var amountsByUserByDateByCurrency = {};
      var maxId = -1;

      for (var i = 0; i < fares.length; i++) {
        var payment = fares[i];
        if(payment.max_id > maxId) {
          maxId = payment.max_id;
        }
        if(payment.currency_code) {
          if(!amountsByUserByDateByCurrency.hasOwnProperty(payment.user_id)) {
            amountsByUserByDateByCurrency[payment.user_id] = {};
          }
          if(!amountsByUserByDateByCurrency[payment.user_id].hasOwnProperty(payment.date)) {
            amountsByUserByDateByCurrency[payment.user_id][payment.date] = {};
          }
          amountsByUserByDateByCurrency[payment.user_id][payment.date][payment.currency_code] = payment.amount;
        }
      }
      for (var i = 0; i < tips.length; i++) {
        var tip = tips[i];
        if(tip.max_id > maxId) {
          maxId = tip.max_id;
        }
        if(tip.tip_currency_code) {
          if(!amountsByUserByDateByCurrency.hasOwnProperty(tip.user_id)) {
            amountsByUserByDateByCurrency[tip.user_id] = {};
          }
          if(!amountsByUserByDateByCurrency[tip.user_id].hasOwnProperty(tip.date)) {
            amountsByUserByDateByCurrency[tip.user_id][tip.date] = {};
          }
          if(!amountsByUserByDateByCurrency[tip.user_id][tip.date].hasOwnProperty(tip.tip_currency_code)){
            amountsByUserByDateByCurrency[tip.user_id][tip.date][tip.tip_currency_code] = tip.amount;
          } else {
            amountsByUserByDateByCurrency[tip.user_id][tip.date][tip.tip_currency_code] += tip.amount;
          }
        }
      }

      return [maxId, amountsByUserByDateByCurrency];
    });
}

function updateAggregations(farmedInDetailedByUserByDate, farmedOutDetailedByUserByDate, farmedInTotalByUserByDate, farmedOutTotalByUserByDate, maxId) {
  return store.db
    .transaction(function(transaction){
      var operations = [];
      for(var userId in farmedInDetailedByUserByDate) {
        operations.push(createDetailedAggregation(transaction, userId, farmedInDetailedByUserByDate[userId], true));
      }
      for(var userId in farmedOutDetailedByUserByDate) {
        operations.push(createDetailedAggregation(transaction, userId, farmedOutDetailedByUserByDate[userId], false));
      }
      var totalByUser = {};
      for(var userId in farmedInTotalByUserByDate) {
        totalByUser[userId] = {};
        for(var date in farmedInTotalByUserByDate[userId]) {
          totalByUser[userId][date] = {
            farmedIn: farmedInTotalByUserByDate[userId][date],
            farmedOut: 0
          };
        }
      }
      for(var userId in farmedOutTotalByUserByDate) {
        if(!totalByUser.hasOwnProperty(userId)) {
          totalByUser[userId] = {};
        }
        for(var date in farmedOutTotalByUserByDate[userId]) {
          if(!totalByUser[userId].hasOwnProperty(date)) {
            totalByUser[userId][date] = {
              farmedIn: 0
            };
          }
          totalByUser[userId][date].farmedOut = farmedOutTotalByUserByDate[userId][date];
        }
      }
      for(var userId in totalByUser) {
        operations.push(createTotalAggregation(transaction, userId, totalByUser[userId]));
      }
      if(operations) {
        operations.push(markAsProcessed(transaction, maxId));
        return Promise
          .all(operations)
          .then(transaction.commit)
          .error(function(err){
            console.log('TRANSACTION FAILED', err);
            transaction.rollback();
          });
      }
    });
}

function convert(amount, fromCurrency, toCurrency, date) {
  if(fromCurrency === toCurrency) {
    return Promise.resolve(amount);
  } else if(moment(date, 'YYYY-MM-DD').isSame(moment().utc(), 'day')) {
    return currencyConversion.convert(amount, fromCurrency, toCurrency);
  } else {
    return getCurrencyRates(date)
            .then(function(conversionMatrix){
              return amount * conversionMatrix[fromCurrency][toCurrency].rate;
            });
  }
}

function aggregateAmountsToSameCurrency(amountsByCurrency, toCurrency, date) {
  var result = 0;
  var conversionChain = Promise.resolve();
  for(var fromCurrency in amountsByCurrency) {
    (function(amount, fromCurrency, toCurrency, date){
      conversionChain = conversionChain
                        .then(function(){
                          return convert(amountsByCurrency[fromCurrency],
                                          fromCurrency,
                                          toCurrency,
                                          date)
                        })
                        .then(function(res){
                          result += res;
                        });
    })(amountsByCurrency[fromCurrency], fromCurrency, toCurrency, date);
  }
  return conversionChain.then(function() { return result });
}

function getTotalByUserByDate(amountsByUserByDateByCurrency) {
  return store
    .db('users')
    .where('role', 'network')
    .select(
      'users.id',
      store.raw('(SELECT name FROM currency_codes WHERE id = users.currency_code_id) as currency_code')
    )
    .then(function(users){
      var totalByUserByDate = {};
      var conversionChain = Promise.resolve();
      for(var i = 0; i < users.length; i++) {
        var user = users[i];
        if(amountsByUserByDateByCurrency.hasOwnProperty(user.id)) {
          totalByUserByDate[user.id] = {};
          for (var date in amountsByUserByDateByCurrency[user.id]) {
            var amountsByCurrency = amountsByUserByDateByCurrency[user.id][date];
            (function(userId, date, amounts, targetCurrency){
              conversionChain = conversionChain
                                .then(function(){
                                  return aggregateAmountsToSameCurrency(amounts, targetCurrency, date);
                                })
                                .then(function(total){
                                  totalByUserByDate[userId][date] = total;
                                });
            })(user.id, date, amountsByCurrency, user.currency_code);
          }
        }
      }
      return conversionChain.then(function(){ return totalByUserByDate });
    });
}

function aggregatePayments() {
  console.log(new Date(), '- Starting aggregation process... ');
  Promise
    .all([
      getAmountsByUserByDateByCurrency('farmed-in'),
      getAmountsByUserByDateByCurrency('farmed-out')
    ])
    .then(function(results){
      var farmedInByUserByDateByCurrency = results[0][1];
      var farmedOutByUserByDateByCurrency = results[1][1];
      var maxId = results[0][0] > results[1][0] ? results[0][0] : results[1][0];
      Promise
        .all([
          getTotalByUserByDate(farmedInByUserByDateByCurrency),
          getTotalByUserByDate(farmedOutByUserByDateByCurrency)
        ])
        .then(function(results){
          var farmedInTotalByUserByDate = results[0];
          var farmedOutTotalByUserByDate = results[1];
          updateAggregations(farmedInByUserByDateByCurrency,
                              farmedOutByUserByDateByCurrency,
                              farmedInTotalByUserByDate,
                              farmedOutTotalByUserByDate,
                              maxId)
                              .then(function(){
                                console.log('done.')
                              });
        });
    })
    .error(function(err){
      console.log('Aggregate payments error', err);
    });
}

currencyConversion
.init()
.then(function(){
  aggregatePayments();
  setInterval(function(){
    aggregatePayments();
  }, moment.duration(1, 'hours').asMilliseconds());
});