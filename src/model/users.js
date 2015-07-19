var Promise = require('bluebird');
var moment = require('moment');
var store = require('../store/store');

function getISOStringFromMoment(moment) {
  return moment.format().toString();
}

function toStoreUser(apiUser) {
  var user =  {
    id: apiUser.id,
    name: apiUser.name,
    passwordHash: '',
    email: apiUser.email,
    token: apiUser.token,
    role: apiUser.role,
    endpointType: apiUser.endpointType,
    callbackUrl: apiUser.callbackUrl,
    createdAt: getISOStringFromMoment(apiUser.creation),
    lastUpdate: getISOStringFromMoment(apiUser.lastUpdate),
    products: apiUser.products
  };
  return user;
}

function toApiUser(storeUser, storeProducts, storeProductsCoverage) {
  var user =  {
    id: storeUser.id,
    name: storeUser.name,
    token: storeUser.token,
    email: storeUser.email,
    role: storeUser.role,
    endpointType: storeUser.endpoint_type,
    callbackUrl: storeUser.callback_url,
    mustAcceptCashPayment: storeUser.must_accept_cash_payment === 1,
    mustAcceptPrescheduled: storeUser.must_accept_prescheduled === 1,
    mustAcceptOndemand: storeUser.must_accept_ondemand === 1,
    mustAcceptAccountPayment: storeUser.must_accept_account_payment === 1,
    mustAcceptCreditcardPayment: storeUser.must_accept_creditcard_payment === 1,
    minRating: storeUser.min_rating,
    routingStrategy: storeUser.routing_strategy,
    createdAt: moment(storeUser.created_at),
    lastUpdate: moment(storeUser.updated_at),
    products: [],
    productsById: {}
  };
  var coverageByProductId = {};
  for(var i = 0; i < storeProductsCoverage.length; i++) {
    var c = storeProductsCoverage[i];
    if(!coverageByProductId.hasOwnProperty(c.product_id)) {
      coverageByProductId[c.product_id] = [];
    }
    coverageByProductId[c.product_id].push({
      radius: c.coverage_radius,
      center: {
        lat: c.coverage_lat,
        lng: c.coverage_lng
      }
    });
  }
  for(var i = 0; i < storeProducts.length; i++) {
    var sp = storeProducts[i];
    var product = {
      id: sp.id,
      name: sp.name,
      imageUrl: sp.image_url,
      capacity: sp.capacity,
      acceptsPrescheduled: sp.accepts_prescheduled === 1,
      acceptsOndemand: sp.accepts_ondemand === 1,
      acceptsCashPayment: sp.accepts_cash_payment === 1,
      acceptsAccountPayment: sp.accepts_account_payment === 1,
      acceptsCreditcardPayment: sp.accepts_creditcard_payment === 1,
      coverage: coverageByProductId.hasOwnProperty(sp.id) ? coverageByProductId[sp.id] : []
    };
    user.products.push(product);
    user.productsById[product.id] = product;
  }
  return user;
}

function UsersModel() {

}

UsersModel.prototype.create = function(user) {
  return store.createUser(toStoreUser(user));
};

UsersModel.prototype.update = function(user) {
  var storeUser = toStoreUser(user);
  return Promise
    .all([
      store.updateUser(storeUser),
      store.updateProducts(storeUser.id, storeUser.products),
      store.updateProductsCoverage(storeUser.id, storeUser.products)
    ]);
};

UsersModel.prototype.getAll = function() {
  return store
    .getAllUsers()
    .bind(this)
    .then(function(allUsers){
      if(!allUsers || allUsers.length === 0) {
        return [];
      }
      var getAllInfo = [];
      for (var i = 0; i < allUsers.length; i++) {
        var user = allUsers[i];
        getAllInfo.push(this.getById(user.id));
      }
      return Promise.all(getAllInfo);
    });
};

UsersModel.prototype.getById = function(id) {
  return Promise
    .all([store.getUserById(id), store.getProducts(id), store.getUserProductsCoverage(id)])
    .then(function(res){
      return res[0].length > 0 ? toApiUser(res[0][0], res[1], res[2]) : null;
    });
};

UsersModel.prototype.getByToken = function(token) {
  return store
    .getUserByToken(token)
    .bind(this)
    .then(function(res){
      return res.length > 0 ? this.getById(res[0].id) : null;
    });
};

module.exports = new UsersModel();