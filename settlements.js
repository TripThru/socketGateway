var config = require('./config');
var moment = require('moment');
var store = require('./src/store/store');
store.init(config.db);

function settle() {
  store
    .getAllUsers()
    .then(function(users){
      for(var i = 0; i < users.length; i++) {
        (function(user){
          if(user.balance > 1000) {
            store
              .decrementUserBalance(user.id, user.balance - 1000)
              .then(function(){
                store
                  .createUserTransaction(
                    user.id,
                    user.balance - 1000,
                    user.currency_code,
                    'transfer-out',
                    moment().utc().format().toString(),
                    100
                  );
              });
          }
        })(users[i]);
      }
    })
    .error(function(err){
      console.log('Settlement error', err);
    });
}

settle();
setInterval(function(){
  settle();
}, moment.duration(1, 'hours').asMilliseconds());


