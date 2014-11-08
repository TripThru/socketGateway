var kue = require('kue');   
var config = require('../../config');
var jobs = kue.createQueue(config.kue); 

var self = module.exports = {
    
    newJob: function(name, data, onComplete, onFailed, onProgress) {
      var job = jobs.create(name, data);
      job.save();
      if(onComplete)
        job.on('complete', onComplete);
      if(onFailed)
        job.on('failed', onFailed);
      if(onProgress)
        job.on('progress', onProgress);
    },
    processJob: function(name, task) {
      jobs.process(name, function (job, done){
        task(job.data, done);
      });
    }
}