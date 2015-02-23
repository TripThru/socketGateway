var store = require('../store/store');

function toStoreUser(apiUser) {
  return apiUser;
}

function toApiUser(storeUser) {
  var user =  {
    id: storeUser[0].user_db_id,
    clientId: storeUser[0].user_client_id,
    name: storeUser[0].user_name,
    fullname: storeUser[0].full_name,
    token: storeUser[0].token,
    email: storeUser[0].email,
    role: storeUser[0].role,
    endpointType: storeUser[0].endpoint_type,
    callbackUrl: storeUser[0].callback_url,
    callbackToken: storeUser[0].callback_token,
    fleets: [],
    fleetsById: {}
  };
  for(var i = 0; i < storeUser.length; i++) {
    var su = storeUser[i];
    var fleet = {
      id: su.fleet_db_id,
      clientId: su.fleet_client_id,
      name: su.fleet_name,
      coverage: {
        radius: su.coverage_radius,
        center: {
          lat: su.coverage_lat,
          lng: su.coverage_lng
        }
      }
    };
    user.fleets.push(fleet);
    user.fleetsById[fleet.clientId] = fleet;
  }
  return user;
}

function UsersModel() {
  
}

UsersModel.prototype.update = function(user) {
  return store.updateUser(toStoreUser(user));
};

UsersModel.prototype.getAll = function() {
  return store
    .getAllUsers()
    .then(function(allUsers){
      if(!allUsers || allUsers.length === 0) {
        return [];
      }
      var storeUsersById = {};
      for(var i = 0; i < allUsers.length; i++) {
        var u = allUsers[i];
        if(u) {
          if(!storeUsersById.hasOwnProperty(u.user_client_id)) {
            storeUsersById[u.user_client_id] = [u];
          } else {
            storeUsersById[u.user_client_id].push(u);
          }
        }
      }
      var users = [];
      for(var id in storeUsersById) {
        if(storeUsersById.hasOwnProperty(id)) {
          users.push(toApiUser(storeUsersById[id]));
        }
      }
      return users;
    });
};

UsersModel.prototype.getByClientId = function(id) {
  return store
    .getUserByClientId(id)
    .then(function(res){
      return res.length > 0 ? toApiUser(res) : null;
    });
};

UsersModel.prototype.getByToken = function(token) {
  return store
    .getUserByToken(token)
    .then(function(res){
      return res.length > 0 ? toApiUser(res) : null;
    });
};

module.exports = new UsersModel();