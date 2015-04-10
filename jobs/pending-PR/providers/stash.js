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

  var users = _.object(_.map(fetch.team, function (user) {
      return [ user.username, { 'PRs': 0, 'display': user.display, 'email': user.email } ];
  }));

  getRepoSlugNames()
    .then(getAllRepoPullRequests)
    .then(formatResponse)
    .nodeify(callback);

  function formatResponse() {
    return q.when(_.map(users, function(value, key) {
        var tuple = { user: { username: key}, PR: value.PRs };
        if(value.display) { 
          tuple.user.display = value.display; 
        }
        if(value.email) {
          tuple.user.email = value.email;
        }
        return tuple;
    }));
  }

  function getAllRepoPullRequests(repositories) {
    return q.all(_.map(repositories, function(repository) {
      return getRepoPullRequests(stashBaseUrl + '/' + repository + '/pull-requests?order=NEWEST&limit=100' );
    }));
  }

  function getRepoPullRequests(pullRequestsUrl) {

    return getJSON({ url: pullRequestsUrl, headers: getAuthHeader() })
      .then(function(data) {
        if (!(data && data.values)){
          return q.reject('no data');
        }

        for (var i = 0; i < fetch.team.length; i++) {
          var prs = 0;
          for (var d = 0; d < data.values.length; d++) {
            prs = prs + data.values[d].reviewers.filter(function (reviewer) {
              return reviewer.user.name === fetch.team[i].username && !reviewer.approved;
            }).length;
          }
          users[fetch.team[i].username].PRs += prs;
        }
        return q.resolve();
      })
      .fail(function(err) {
        return q.reject(err);
      });
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
          if (!(data && data.values)){
            return q.reject('no data');
          }

          for (var d = 0; d < data.values.length; d++) {
            repositories.push(data.values[d].slug);
          }

          return q.resolve(repositories);

        })
        .fail(function(err) {
          return q.reject(err);
        });

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