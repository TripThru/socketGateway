var redis = require("redis");
var Promise = require('bluebird');

function RedisClient(id) {
  this.client = redis.createClient();
  this.id = id;
}

RedisClient.prototype.add = function(key, value) {
  return new Promise(function(resolve, reject){
    this.client
      .hget(this.id, key, function(err, reply){
        if(err) {
          reject(err);
        } else if(reply) {
          reject(new Error(key + ' already exists in ' + this.id));
        } else {
          this.client.hset(this.id, key, JSON.stringify(value));
          resolve();
        }
      }.bind(this));
  }.bind(this));
};

RedisClient.prototype.update = function(key, value) {
  return new Promise(function(resolve, reject){
    this.client
      .hget(this.id, key, function(err, reply){
        if(err) {
          reject(err);
        } else if(!reply) {
          reject(new Error(key + ' does not exist in ' + this.id));
        } else {
          this.client.hset(this.id, key, JSON.stringify(value));
          resolve();
        }
      }.bind(this));
  }.bind(this));
};

RedisClient.prototype.get = function(key) {
  return new Promise(function(resolve, reject){
    this.client
      .hget(this.id, key, function(err, reply){
        if(err) {
          reject(err);
        } else {
          resolve(JSON.parse(reply));
        }
      }.bind(this));
  }.bind(this));
};

RedisClient.prototype.del = function(key) {
  this.client.hdel(this.id, key);
};

RedisClient.prototype.getAll = function() {
  return new Promise(function(resolve, reject){
    this.client
      .hgetall(this.id, function(err, reply){
        if(err) {
          reject(err);
        } else {
          var values = Object.keys(reply || {}).map(function(id){
            return JSON.parse(reply[id]);
          });
          resolve(values);
        }
      }.bind(this));
  }.bind(this));
};

RedisClient.prototype.clear = function() {
  this.client.hkeys(this.id, function(err, keys) {
    if(keys) {
      keys.forEach(function(key){
        this.del(key);
      }.bind(this));
    }
  }.bind(this));
};

module.exports = RedisClient;