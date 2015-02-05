var store = require('../store/store');

function cloneUser(user) {
  var u = {
      id: user.id,
      name: user.name,
      fullname: user.fullname,
      token: user.token,
      role: user.role,
      email: user.email,
      coverage: user.coverage,
      fleets: user.fleets,
      vehicleTypes: user.vehicleTypes  
  };
  return u;
}

function UsersModel() {
  
}

UsersModel.prototype.add = function(user) {
  return store.createUser(cloneUser(user));
};

UsersModel.prototype.update = function(user) {
  return store.updateUser(cloneUser(user));
};

UsersModel.prototype.getAll = function() {
  return store
    .getAllUsers()
    .then(function(allUsers){
      if(!allUsers || allUsers.length === 0) {
        return [];
      }
      var users = [];
      for(var i = 0; i < allUsers.length; i++) {
        if(allUsers[i]){
          users.push(cloneUser(allUsers[i].toObject()));
        }
      }
      return users;
    });
};

UsersModel.prototype.getById = function(id) {
  return store
    .getUserBy({id: id})
    .then(function(res){
      if(res.length > 0)
        res = cloneUser(res[0].toObject());
      else
        res = null;
      return res;
    });
};

UsersModel.prototype.getByToken = function(token) {
  return store
    .getUserBy({token: token})
    .then(function(res){
      if(res.length > 0)
        res = cloneUser(res[0].toObject());
      else
        res = null;
      return res;
    });
};

module.exports = new UsersModel();