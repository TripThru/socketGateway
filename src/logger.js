var moment = require('moment');

function Message(text, json) {
  this.text = text;
  this.json = json;
}

function Sublog(id, origin, destination, type, status) {
  this.id = id;
  this.origin = origin || null;
  this.destination = destination || null;
  this.type = type || null;
  this.status = status || null;
  this.creation = moment();
  this.messages = [];
}

Sublog.prototype.setOrigin = function(origin) {
  this.origin = origin;
};

Sublog.prototype.setDestination = function(destination) {
  this.destination = destination;
};

Sublog.prototype.setType = function(type) {
  this.type = type;
};

Sublog.prototype.setStatus = function(status) {
  this.status = status;
};

Sublog.prototype.log = function(message, json) {
  console.log(this.id, ':', message);
  this.messages.push(new Message(message, json));
};

function Logger(){
  this.logs = [];
  this.logLifeTime = moment.duration(20, 'minutes');
  this.cleanupInterval = moment.duration(5, 'minutes');
  setInterval(this.removeOldLogs.bind(this), this.cleanupInterval.asMilliseconds());
}

Logger.prototype.removeOldLogs = function() {
  var len = this.logs.length;
  while(--len >= 0) {
    if(moment(this.logs[len].creation).add(this.logLifeTime).isBefore(moment())) {
      this.logs.splice(len, 1);
    }
  }
};

Logger.prototype.getSublog = function(id, origin, destination, type, status) {
  var sublog = new Sublog(id, origin, destination, type, status);
  this.logs.push(sublog);
  return sublog;
};

Logger.prototype.getLogs = function() {
  return this.logs;
};

Logger.prototype.getLogsById = function(id) {
  var l = [];
  for(var i = 0; i < this.logs.length; i++) {
    var log = this.logs[i];
    if(log.id === id) {
      l.push(log);
    }
  }
  return l;
};

module.exports = new Logger();