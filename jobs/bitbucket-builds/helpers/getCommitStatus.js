var Q = require('q');
var bbRequest = require('./bitbucketRequest');
var statusConstants = require('./statusConstants');

module.exports = function getCommitStatus(repo, config, commitHash) {
  return Q.Promise(function(resolve, reject) {
    bbRequest({
      endpoint: '/2.0/repositories/' + repo + '/commit/' + commitHash + '/statuses',
      config: config,
    }, function(err, response, body) {
      if (err) reject(err);

      var finalStatus = statusConstants.SUCCESSFUL;
      var knownStatuses = [statusConstants.INPROGRESS, statusConstants.FAILED];
      for (var i = 0; i < body.values.length; i++) {
        var loopStatus = body.values[i].state.toLowerCase();
        if (knownStatuses.indexOf(loopStatus) >= 0) {
          finalStatus = loopStatus;
          break;
        }
      }

      resolve(finalStatus);
    });
  });
}
