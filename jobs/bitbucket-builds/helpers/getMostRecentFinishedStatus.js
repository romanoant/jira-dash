var Q = require('q');
var firstCommitWithStatus = require('./firstCommitWithStatus');
var statusConstants = require('./statusConstants');

module.exports = function getMostRecentFinishedStatus(config, commits) {
  return Q.Promise(function(resolve) {
    var successOrFail = [statusConstants.SUCCESSFUL, statusConstants.FAILED];
    firstCommitWithStatus(1, config.repo, config, commits, successOrFail)
    .then(function(result) {
      resolve(result ? result.status : statusConstants.UNKNOWN);
    })
    .catch(function(e) {
      console.log(e);
    });
  });
}
