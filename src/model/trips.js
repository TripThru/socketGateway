var store = require('../store/store');

// Public

var self = module.exports = {
  add: function(trip) {
    return store.createTrip(trip).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred adding trip ' + err);
    });
  },
  update: function(trip) {
    return store.updateTrip(trip).then(function(res){
      return res;
    }).error(function(err) {
      console.log('Error ocurred updating trip ' + err);
    });
  },
  getById: function(tripId) {
    return store.getTripBy({id: tripId}).then(function(res){
      return res;
    }).error(function(err){
      console.log('Error ocurred getting trip ' + err);
    });
  }
}