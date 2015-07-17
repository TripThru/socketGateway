var moment = require('moment');
var userId = 0;

function User() {
  userId++;
  this.clientId = 'testuser' + userId + '@tripthru.com';
  this.name = 'testuser' + userId;
  this.fullName = 'Test User ' + userId;
  this.passwordHash = 'password' + userId;
  this.email = 'testuser' + userId + '@testuser.com';
  this.token = 'tokenuser' + userId;
  this.role = 'partner';
  this.endpointType = 'socket';
  this.callbackUrl = 'callback url user ' + userId;
  this.creation = moment().format().toString();
  this.lastUpdate = moment().add(1, 'minutes').format().toString();
  this.products = [];
}

User.prototype.update = function(storeUserId) {
  this.storeId = storeUserId;
  this.fullName = 'Updated ' + this.fullName;
  this.callbackUrl = 'Updated ' + this.callbackUrl;
  this.lastUpdate = moment(this.lastUpdate).add(1, 'minutes').format().toString();
};

User.prototype.addProducts = function() {
  this.products = [
      {
        clientId: 'Test product client id 1-' + this.storeId,
        name: 'Test product 1-' + this.storeId,
        imageUrl: 'image url 1-' + this.storeId,
        capacity: 2000,
        acceptsPrescheduled: true,
        acceptsOndemand: true,
        acceptsCashPayment: true,
        acceptsAccountPayment: true,
        acceptsCreditcardPayment: true,
        coverage: {
          radius: 50,
          center: {
            lat: 12.04,
            lng: 14.23
          }
        }
      },
      {
        clientId: 'Test product client id 2-' + this.storeId,
        name: 'Test product 2-' + this.storeId,
        imageUrl: 'image url 2-' + this.storeId,
        capacity: 1500,
        acceptsPrescheduled: true,
        acceptsOndemand: false,
        acceptsCashPayment: true,
        acceptsAccountPayment: false,
        acceptsCreditcardPayment: true,
        coverage: {
          radius: 30,
          center: {
            lat: 102.04,
            lng: 122.23
          }
        }
      }
  ];
};

User.prototype.updateProducts = function(storeProducts) {
  this.lastUpdate = moment(this.lastUpdate).add(1, 'minutes').format().toString();
  for(var i = 0; i < this.products.length; i++) {
    this.products[i].storeId = storeProducts[i].product_db_id;
    this.products[i].name = 'Updated ' + this.products[i].name;
    this.products[i].imageUrl = 'Updated ' + this.products[i].imageUrl;
    this.products[i].capacity = this.products[i].capacity + 200;
    this.products[i].acceptsPrescheduled = !this.products[i].acceptsPrescheduled;
    this.products[i].acceptsOndemand = !this.products[i].acceptsOndemand;
    this.products[i].acceptsCashPayment = !this.products[i].acceptsCashPayment;
    this.products[i].acceptsAccountPayment = !this.products[i].acceptsAccountPayment;
    this.products[i].acceptsCreditcardPayment = !this.products[i].acceptsCreditCardPayment;
    this.products[i].coverage.radius = this.products[i].coverage.radius + 15;
    this.products[i].coverage.center.lat = this.products[i].coverage.center.lat + 1.5;
    this.products[i].coverage.center.lng = this.products[i].coverage.center.lng + 0.2;
  }
  this.products = this.products.splice(0, 1);
}

module.exports = User;