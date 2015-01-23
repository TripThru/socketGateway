var store = require('../store/store');

function cloneUser(user) {
  var u = {
      id: user.id,
      name: user.name,
      token: user.token,
      role: user.role,
      email: user.email,
      coverage: user.coverage,
      fleets: user.fleets,
      vehicleTypes: user.vehicleTypes  
  };
  return u;
}

// Public

var self = module.exports = {
    
  add: function(user) {
    return store
      .createUser(cloneUser(user))
      .error(function(err){
        console.log('Error ocurred adding user ' + err);
        throw new Error('Error ocurred adding user ' + err);
      });
  },
  update: function(user) {
    return store
      .updateUser(cloneUser(user))
      .error(function(err){
        console.log('Error ocurred updating user ' + err);
        throw new Error('Error ocurred updating user ' + err);
      });
  },
  getAll: function() {
    return store
      .getAllUsers()
      .then(function(allUsers){
        if(!allUsers || allUsers.length === 0) {
          return [];
        }
        var users = [];
        for(var i = 0; i < allUsers.length; i++) {
          if(allUsers[i]){
            users.push(cloneUser(allUsers[i]));
          }
        }
        return users;
      })
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
          res = cloneUser(res[0].toObject());
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
          res = cloneUser(res[0].toObject());
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