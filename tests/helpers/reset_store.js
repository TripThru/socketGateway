module.exports = function resetStore(store) {
  return store
    .raw('SET FOREIGN_KEY_CHECKS=0')
    .then(function(){
      return store.db.raw('TRUNCATE trip_payment');
    })
    .then(function(){
      return store.db.raw('TRUNCATE trip_locations');
    })
    .then(function(){
      return store.db.raw('TRUNCATE trips');
    })
    .then(function(){
      return store.db.raw('TRUNCATE product_coverages');
    })
    .then(function(){
      return store.db.raw('TRUNCATE products');
    })
    .then(function(){
      return store.db.raw('TRUNCATE users');
    })
    .then(function(){
      return store.db.raw('SET FOREIGN_KEY_CHECKS=1');
    });
}