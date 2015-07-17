var User = require('./store/users');

module.exports = function(store) {
  var user = new User();
  return store
    .createUser(user)
    .then(function(){
      return store.getUserByClientId(user.clientId);
    })
    .then(function(res){
      user.update(res[0].user_db_id);
      user.addProducts();
      return store.updateUser(user);
    })
    .then(function(){
      return store.getUserByClientId(user.clientId);
    })
    .then(function(res){
      user.updateProducts(res);
      return user;
    });
}