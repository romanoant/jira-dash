/**
 * Provider strategy for Stash. Expected output format:
 * <pre>[ { user: { username: iloire }, PR: 4 } ]</pre>
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

  var validationError = validateParams();
  if(validationError) {
    return callback('error in source "' + fetch.sourceId + '": ' + validationError);
  }

  var stashBaseUrl = fetch.options.baseUrl + '/rest/api/1.0/projects/' + fetch.repository.project + '/repos';

  getRepoSlugNames()
    .then(getAllRepoPullRequests)
    .then(formatResponse)
    .nodeify(callback);

  function formatResponse(approversArray) {

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

  function getAllRepoPullRequests(repositories) {
    return q.all(_.map(repositories, function(repository) {
      return getRepoPullRequests(stashBaseUrl + '/' + repository + '/pull-requests?order=NEWEST&limit=100' );
    }));
  }

  function getRepoPullRequests(pullRequestsUrl) {

    var approvers = arguments[1] || _.object(_.map(fetch.team, function (user) {
      return [ user.username, 0 ];
    }));

    return getJSON({ url: pullRequestsUrl, headers: getAuthHeader() })
      .then(function(data) {
        data = data && (data[0] || data);
        if (!(data && data.values)){
          return q.reject('no data');
        }

        for (var i = 0; i < fetch.team.length; i++) {
          var prs = 0;
          for (var d = 0; d < data.values.length; d++) {
            prs = prs + data.values[d].reviewers.filter(function (reviewer) {
              return reviewer.user.name === fetch.team[i].username && needsAction(reviewer);
            }).length;
          }
          approvers[fetch.team[i].username] += prs;
        }
        return approvers;
      });

    /**
     * Returns true if a reviewer needs to act on a PR (i.e. has not yet reviewed it or needs to review again). This
     * should work for both the old and new stash APIs.
     */
    function needsAction(reviewer) {
      if (typeof reviewer.status == 'string') {
        // new status/role API
        return !(reviewer.status === 'APPROVED' || reviewer.status === 'NEEDS_WORK') && reviewer.role !== 'PARTICIPANT';
      } else {
        // old approved API
        return !reviewer.approved;
      }
    }
  }

  function getRepoSlugNames() {

    var repositories = [];

    // If repo name is supplied, use that, otherwise get all from the project
    if (fetch.repository.repository) { 
      repositories.push(fetch.repository.repository);
      return q.resolve(repositories);
    } else {

      return getJSON({ url: stashBaseUrl + '?limit=100', headers: getAuthHeader() })
        .then(function(data) {
          data = data && (data[0] || data);
          if (!(data && data.values)){
            return q.reject('no data');
          }

          for (var d = 0; d < data.values.length; d++) {
            repositories.push(data.values[d].slug);
          }
          return repositories;
        })
    };

  }

  function getAuthHeader() {
    if(fetch.auth) {
      return { 'authorization': 'Basic ' + new Buffer(fetch.auth.username + ':' + fetch.auth.password).toString('base64') };
    } 
  }

  function validateParams() {
    if (!fetch.options) { return 'missing options'; }
    if (!fetch.options.baseUrl) { return 'missing baseUrl in options: ' + JSON.stringify(fetch.options); }
    if (!fetch.repository.project) { return 'missing project field in repository: ' + JSON.stringify(fetch.repository); }
  }

};
