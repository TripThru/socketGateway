var store = require('../store/store');

// Public

var self = module.exports = {
  add: function(trip) {
    return store.createTrip(trip).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred adding trip ' + err);
      throw new Error();
    });
  },
  update: function(trip) {
    return store.updateTrip(trip).then(function(res){
      return res;
    }).error(function(err) {
      console.log('Error ocurred updating trip ' + err);
      throw new Error();
    });
  },
  getById: function(tripId) {
    return store.getTripBy({id: tripId}).then(function(res){
      if(res.length > 0)
        res = res[0];
      else
        res = null;
      return res;
    }).error(function(err){
      console.log('Error ocurred getting trip ' + err);
      throw new Error();
    });
  }
}