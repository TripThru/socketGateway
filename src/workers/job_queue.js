var kue = require('kue');   
var config = require('../../config');
var jobs = kue.createQueue(config.kue); 
kue.app.set('Job queue', 'TripThru');
kue.app.listen(3301);

var self = module.exports = {
    
    newJob: function(name, data, onComplete, onFailed, onProgress) {
      var job = jobs.create(name, data);
      job.removeOnComplete(true);
      job.save();
      if(onComplete)
        job.on('complete', onComplete);
      if(onFailed)
        job.on('failed', onFailed);
      if(onProgress)
        job.on('progress', onProgress);
    },
    processJob: function(name, task) {
      jobs.process(name, 10, function (job, done){
        task(job.data, done);
      });
    },
    clear: function() {
      jobs.client.keys("q:*", function(err, keys) {
        if(keys) {
          keys.forEach(function(key){
            jobs.client.del(key, function(err) {});
          });
        }
      });
    }
};
