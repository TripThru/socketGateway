var store = require('../store/store');

// Public

var self = module.exports = {
    
  add: function(user) {
    return store
      .createUser(user)
      .error(function(err){
        console.log('Error ocurred adding user ' + err);
        throw new Error('Error ocurred adding user ' + err);
      });
  },
  update: function(user) {
    return store
      .updateUser(user)
      .error(function(err){
        console.log('Error ocurred updating user ' + err);
        throw new Error('Error ocurred updating user ' + err);
      });
  },
  getAll: function() {
    return store
      .getAllUsers()
      .error(function(err){
        console.log('Error ocurred getting all users ' + err);
        throw new Error('Error ocurred getting all users ' + err);
      });
  },
  getById: function(userId) {
    return store
      .getUserBy({id: userId})
      .then(function(res){
        if(res.length > 0)
          res = res[0].toObject();
        else
          res = null;
        return res;
      })
      .error(function(err){
        console.log('Error ocurred getting user ' + err);
        throw new Error('Error ocurred getting user ' + err);
      });
  },
  getByToken: function(token) {
    return store
      .getUserBy({token: token})
      .then(function(res){
        if(res.length > 0)
          res = res[0].toObject();
        else
          res = null;
        return res;
      })
      .error(function(err){
        console.log('Error ocurred getting user ' + err);
        throw new Error('Error ocurred getting user ' + err);
      });
  }
};