var queue = require('./job_queue');

queue.processJob('dispatch', function(job, done){
  
});

module.exports = {
    
    newDispatchJob: function(request) {
      queue.newJob('dispatch', request);
    },
    newUpdateTripStatusJob: function(request) {
      queue.newJob('update-trip-status', request);
    }
}