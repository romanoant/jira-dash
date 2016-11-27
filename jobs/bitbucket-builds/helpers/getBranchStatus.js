var Q = require('q');
var bbRequest = require('./bitbucketRequest');
var getCommitStatus = require('./getCommitStatus');
var findCulprit = require('./findCulprit');
var getMostRecentFinishedStatus = require('./getMostRecentFinishedStatus');
var statusConstants = require('./statusConstants');

module.exports = function getBranchStatus(config, branchName) {
  return Q.Promise(function(resolve, reject) {
    var commitEndpoint = '/2.0/repositories/' + config.repo + '/commits/' + branchName;
    bbRequest({
      endpoint: commitEndpoint,
      config: config,
    }, function(err, response, body) {
      if (err) reject(err);

      if (body.hasOwnProperty('values') && body.values.length) {
        var commits = body.values;
        getCommitStatus(config.repo, config, commits[0].hash).then(function(commitStatus) {
          var baseResponse = { status: commitStatus };

          // Find the culprit if master is red
          if (config.showCulprits && commitStatus === statusConstants.FAILED) {
            findCulprit(config.repo, config, commits).then(function(culprit) {
              baseResponse.culprit = culprit;
              resolve(baseResponse);
            }).catch(function(e) { console.log(e); });
          } else if (commitStatus === statusConstants.INPROGRESS) {
            getMostRecentFinishedStatus(config, commits).then(function(realStatus) {
              baseResponse.status = realStatus;
              baseResponse.isInProgress = true;
              resolve(baseResponse);
            }).catch(function(e) { console.log(e); });
          } else {
            resolve(baseResponse);
          }
        }).catch(function(e) { console.log(e); });
      } else {
        resolve({ status: statusConstants.UNKNOWN });
      }
    });
  });
}
