var Promise = require('bluebird');

function runInSequence(tasks, functionToCall) {
  var chain = Promise.cast();
  return Promise
    .resolve(tasks)
    .map(function(task) {
      return chain = chain.then(function(){
        return functionToCall(task);
      });
    });
}

module.exports.runInSequence = runInSequence;