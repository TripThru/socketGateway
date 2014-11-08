var store = require('../store/store');

// Public

var self = module.exports = {
    
  add: function(user) {
    return store.createUser(user).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred adding user ' + err);
      throw new Error();
    });
  },
  update: function(user) {
    return store.updateUser(user).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred updating user ' + err);
      throw new Error();
    });
  },
  getById: function(userId) {
    return store.getUserBy({id: userId}).then(function(res){
      if(res.length > 0)
        res = res[0].toObject();
      else
        res = null;
      return res;
    }).error(function(err){
      console.log('Error ocurred getting user ' + err);
      throw new Error();
    });
  },
  getByToken: function(token) {
    return store.getUserBy({token: token}).then(function(res){
      if(res.length > 0)
        res = res[0].toObject();
      else
        res = null;
      return res;
    }).error(function(err){
      console.log('Error ocurred getting user ' + err);
      throw new Error();
    });
  }
}