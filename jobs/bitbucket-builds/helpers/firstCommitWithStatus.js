var Q = require('q');
var getCommitStatus = require('./getCommitStatus');

module.exports = function firstCommitWithStatus(startIndex, repo, config, commits, allowedStatuses) {
  return Q.Promise(function(resolve) {
    var currentCommitIndex = startIndex;
    var tryNextCommit = function() {
      if (commits && currentCommitIndex < commits.length) {
        var commit = commits[currentCommitIndex];
        getCommitStatus(repo, config, commit.hash).then(function(commitStatus) {
          if (allowedStatuses.indexOf(commitStatus) >= 0) {
            resolve({
              commit: commit,
              status: commitStatus,
              index: currentCommitIndex,
            });
          } else {
            currentCommitIndex++;
            tryNextCommit();
          }
        }).catch(function(e) {
          console.log(e);
        });
      } else {
        resolve();
      }
    }

    tryNextCommit();
  });
};
