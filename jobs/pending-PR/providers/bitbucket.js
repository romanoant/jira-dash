/**
 * Provider strategy for Bitbucket.
 *
 * @param {object} fetch a request to fetch information from a source+repo
 * @param {String} fetch.sourceId the id of the source (used for error reporting)
 * @param {object} fetch.repository provider-specific repository object
 * @param {object} fetch.team the team information
 * @param {object} [fetch.options] provider-specific options
 * @param {object} [fetch.auth] authentication info to use
 * @param {object} dependencies
 * @param {Function} callback
 * @returns {*}
 */
module.exports = function (fetch, dependencies, callback) {
  var _ = require('lodash');
  var q = require('q');
  var getJSON = q.nbind(dependencies.easyRequest.JSON, dependencies.easyRequest);

  var bitbucketBaseUrl = 'https://bitbucket.org/api/2.0/repositories/' + encodeURIComponent(fetch.repository.org);

  var validationError = validateParams();
  if(validationError) {
    return callback('error in source "' + fetch.sourceId + '": ' + validationError);
  }

  getRepoNames()
    .then(getAllRepoPullRequests)
    .then(processPullRequestArray)
    .then(transformResponse)
    .nodeify(callback);


  function getAllRepoPullRequests(repositories) {
    return q.all(_.map(repositories, function(repository) {
            var page1Url = bitbucketBaseUrl + '/' 
                           + encodeURIComponent(repository)
                           + '/pullrequests?state=OPEN';

            return getPrList(page1Url);
    })); 
  }

  function processPullRequestArray(pullRequestArray) {
    return q.all(_.map(pullRequestArray,function(pullRequests) {
     return processRemainingPrs(pullRequests);
    }));
  }

  function transformResponse(approversArray) {

    var userResult = _.map(fetch.team, function (user) {
      return { user: user.username, PR: 0 };
    });

    approversArray.forEach(function(approvers) {
      _.keys(approvers).forEach(function(approver) {
        userResult[_.findIndex(userResult,{user: approver})].PR+=approvers[approver];
      });
    });

    return _.map(userResult,function(userTuple) {
      var newUserTuple = {user: { username: userTuple.user}, PR: userTuple.PR};
      var originalUserTuple = fetch.team[_.findIndex(fetch.team,{ username: userTuple.user })];
      if(originalUserTuple.display) {
        newUserTuple.user.display = originalUserTuple.display;
      }
      if(originalUserTuple.email) {
        newUserTuple.user.email = originalUserTuple.email;
      }
      return newUserTuple;
    });

  }

  function getRepoNames() {

    // If repo name is supplied, use that, otherwise get all from the project
    if (fetch.repository.repository) {
      return q.when([fetch.repository.repository]);
    } else {
      var repoUrl = bitbucketBaseUrl + '?pagelen=100';
      return getJSON({ url: repoUrl, headers: getAuthHeader() })
        .then(function(data) {
          data = data && (data[0] || data);
          if (!(data && data.values)){
            return q.reject('no data');
          }
          return q.resolve(_.map(data.values, function (datavalues) {
           return datavalues.name;
          }));
        });
    }

  }

  function validateParams(){
    if (!fetch.repository.org) { return 'missing org field in repository: ' + JSON.stringify(fetch.repository); }
  }

  function getAuthHeader() {
    if(fetch.auth) {
      return { 'authorization': 'Basic ' + new Buffer(fetch.auth.username + ':' + fetch.auth.password).toString('base64') };
    } 
  }

  /**
   * Fetches list of pull requests and processes each one, counting the pending PRs.
   *
   * @param {string} nextPageUrl
   * @param {Array} [pullRequests]
   * @returns {Array} [pullRequests]
   */
  function getPrList() {
    
    var nextPageUrl = arguments[0];
    var pullRequests = arguments[1] || [];

    if (!nextPageUrl) {
      // if there are no more pages then proceed to process each PR
      return q.when(pullRequests);
    }

    return getJSON({ url: nextPageUrl, headers: getAuthHeader() }).then(function (data) {
      data = data && (data[0] || data);
      if (!(data && data.values)) {
        return q.reject('no PRs in list: ' + nextPageUrl);
      } else {
        // Recurse until we have built up a list of all PRs
        return getPrList(data.next, _.union(pullRequests, data.values));
      }    
    });
  }

  /**
   * Recursively fetches PR reviewers, accumulating the results in <code>users</code>, and calls <code>callback</code>
   * when done.
   *
   * @param {Array} remainingPRs an array of pull requests
   * @returns {*}
   */
  function processRemainingPrs() {

    var remainingPRs = arguments[0];
    var approvers = arguments[1] || _.object(_.map(fetch.team, function (user) {
      return [ user.username, 0 ];
    }));


    // return once all PRs have been processed
    if (remainingPRs.length === 0) {
      return q.when(approvers);
    }
    // otherwise fetch a single PR at a time
    if(remainingPRs[0].length === 0) {
      return processRemainingPrs(remainingPRs.slice(1),approvers);
    } else {
      var pullRequestUrl = remainingPRs[0].links.self.href;
      return getJSON({ url: pullRequestUrl, headers: getAuthHeader() }).then(function(data) {
        data = data && (data[0] || data);

        if (!data) {
          return q.reject('no PR in: ' + pullRequestUrl);
        }

        _.each(data.participants, function (participant) {
          var username = participant.user.username;
          if (!participant.approved && !_.isUndefined(approvers[username]) && username !== data.author.username) {
            // +1 for each unapproved PR
            approvers[username]++;
          }
        })

        // recurse until all PRs have been processed
        return processRemainingPrs(remainingPRs.slice(1),approvers);

      });
    }
  }

};
