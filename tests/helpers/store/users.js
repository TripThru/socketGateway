var moment = require('moment');
var userId = 0;

function User() {
  userId++;
  this.id = 'testuser' + userId + '@tripthru.com';
  this.name = 'Test User ' + userId;
  this.passwordHash = 'password' + userId;
  this.email = 'testuser' + userId + '@testuser.com';
  this.token = 'tokenuser' + userId;
  this.role = 'partner';
  this.endpointType = 'socket';
  this.callbackUrl = 'callback url user ' + userId;
  this.createdAt = moment().format().toString();
  this.lastUpdate = moment().add(1, 'minutes').format().toString();
  this.products = [];
}

User.prototype.update = function() {
  this.name = 'Updated ' + this.name;
  this.callbackUrl = 'Updated ' + this.callbackUrl;
  this.lastUpdate = moment(this.lastUpdate).add(1, 'minutes').format().toString();
};

User.prototype.addProducts = function() {
  this.products = [
      {
        id: 'Test product client id 1-' + this.id,
        name: 'Test product 1-' + this.id,
        imageUrl: 'image url 1-' + this.id,
        capacity: 2000,
        acceptsPrescheduled: true,
        acceptsOndemand: true,
        acceptsCashPayment: true,
        acceptsAccountPayment: true,
        acceptsCreditcardPayment: true,
        coverage: [
          {
            radius: 50,
            center: {
              lat: 12.04,
              lng: 14.23
            }
          },
          {
            radius: 20,
            center: {
              lat: 123.04,
              lng: 14.23
            }
          },
          {
            radius: 40,
            center: {
              lat: 12.04,
              lng: 144.23
            }
          }
        ]
      },
      {
        id: 'Test product client id 2-' + this.id,
        name: 'Test product 2-' + this.id,
        imageUrl: 'image url 2-' + this.id,
        capacity: 1500,
        acceptsPrescheduled: true,
        acceptsOndemand: false,
        acceptsCashPayment: true,
        acceptsAccountPayment: false,
        acceptsCreditcardPayment: true,
        coverage: [
          {
            radius: 30,
            center: {
              lat: 102.04,
              lng: 122.23
            }
          }
        ]
      }
  ];
};

User.prototype.updateProducts = function() {
  this.lastUpdate = moment(this.lastUpdate).add(1, 'minutes').format().toString();
  for(var i = 0; i < this.products.length; i++) {
    this.products[i].name = 'Updated ' + this.products[i].name;
    this.products[i].imageUrl = 'Updated ' + this.products[i].imageUrl;
    this.products[i].capacity = this.products[i].capacity + 200;
    this.products[i].acceptsPrescheduled = !this.products[i].acceptsPrescheduled;
    this.products[i].acceptsOndemand = !this.products[i].acceptsOndemand;
    this.products[i].acceptsCashPayment = !this.products[i].acceptsCashPayment;
    this.products[i].acceptsAccountPayment = !this.products[i].acceptsAccountPayment;
    this.products[i].acceptsCreditcardPayment = !this.products[i].acceptsCreditCardPayment;
    for(var c = 0; c < this.products[i].coverage; i++) {
      this.products[i].coverage[c].radius = this.products[i].coverage[c].radius + 15;
      this.products[i].coverage[c].center.lat = this.products[i].coverage[c].center.lat + 1.5;
      this.products[i].coverage[c].center.lng = this.products[i].coverage[c].center.lng + 0.2;
    }
    this.products[i].coverage = this.products[i].coverage.splice(0, 1);
  }
  this.products = this.products.splice(0, 1);
}

module.exports = User;