var models = require('./models');
var resources = require('./resources');

function init(app) {
  var swagger = require("swagger-node-express").createNew(app);
  swagger.configureSwaggerPaths("", "/api-docs", "");
  swagger.addModels(models);
  
  swagger.addPost(resources.setNetworkInfo);
  swagger.addGet(resources.getNetworkInfo);
  swagger.addPost(resources.dispatch);
  swagger.addGet(resources.getTripStatus);
  swagger.addPut(resources.updateTripStatus);
  swagger.addGet(resources.quote);
  swagger.addGet(resources.getDriversNearby);
  swagger.addPost(resources.requestPayment);
  swagger.addPut(resources.acceptPayment);
  
  swagger.configure('http://localhost:3300', '1.0');
}

module.exports.init = init;