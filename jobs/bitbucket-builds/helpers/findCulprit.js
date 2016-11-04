var Q = require('q');
var firstCommitWithStatus = require('./firstCommitWithStatus');
var statusConstants = require('./statusConstants');

function avatarFromCommit(commit) {
  var author = commit.author;
  if (author.hasOwnProperty('user')) {
    return author.user.links.avatar.href;
  }
  return null;
}

// assumes commits[0] is red
module.exports = function findCulprit(repo, config, commits) {
  return Q.Promise(function(resolve) {
    firstCommitWithStatus(1, repo, config, commits, [statusConstants.SUCCESSFUL]).then(function(result) {
      resolve(result ? avatarFromCommit(commits[result.index - 1]) : null);
    });
  });
}
