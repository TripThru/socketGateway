var queue = require('./job_queue');
var quotes = require('../model/quotes');
var convert = require('../convert');
var codes = require('../codes');
var resultCodes = codes.resultCodes;
var socket; // Initialized with init to avoid circular dependency

function quote(job, done) {
  
}

module.exports = {
    init: function(gateway) {
      socket = gateway;
      queue.processJob('quote', dispatchTrip);
    },
    newQuoteJob: function(tripId) {
      var data = { tripId: tripId };
      queue.newJob('quote', data);
    }
}