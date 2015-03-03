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

  var q = require('q');
  var users = [];

  var validationError = validateParams();
  if(validationError) {
    return callback('error in source "' + fetch.sourceId + '": ' + validationError);
  }

  getRepoSlugNames()
    .then(function(repositories) {  return getAllRepoPullRequests(repositories); })
    .then(function() { callback(null, users); } )
    .fail(function(err) { callback(err, users); } )
    .done();

  function getRepoPullRequests(jsonOpts) {

    var deferred = q.defer();

    var onJsonResponse = function(err, data) {

      if (err)
        return deferred.reject(err);

      if (!data || !data.values)
        return deferred.reject('no data');

      for (var i = 0; i < fetch.team.length; i++) {
        var prs = 0;
        for (var d = 0; d < data.values.length; d++) {
          prs = prs + data.values[d].reviewers.filter(function (reviewer) {
            return reviewer.user.name === fetch.team[i].username && !reviewer.approved;
          }).length
        }
        users.push({ user: fetch.team[i], PR: prs });
      }
      return deferred.resolve();
    };

    dependencies.easyRequest.JSON(jsonOpts, onJsonResponse);

    return deferred.promise;

  };

  function getRepoSlugNames() {

    var deferred = q.defer();
    var repositories = [];

    // If repo name is supplied, use that, otherwise get all from the project
    if (fetch.repository.repository) { 

      repositories.push(fetch.repository.repository);

      deferred.resolve(repositories);

    } else {

      var onJsonResponse = function(err, data) {

        if (err)
          return deferred.reject(err);

        if (!data || !data.values)
          return deferred.reject('no data');

        for (var d = 0; d < data.values.length; d++) {
          repositories.push(data.values[d].slug);
        }

        return deferred.resolve(repositories);
      };

      dependencies.easyRequest.JSON(getJsonOptsForRepositoriesApi(), onJsonResponse);

    }

    return deferred.promise;

  }

  function getAuthHeader()
  {
    if(fetch.auth) {
      return { "authorization": "Basic " + new Buffer(fetch.auth.username + ":" + fetch.auth.password).toString("base64") };
    } 
  };

// @returns {*} an option object for use with <code>easyRequest.JSON</code> on each request to the STASH repositories API
  function getJsonOptsForRepositoriesApi() {
    // url and optional auth header
    return {
      url: fetch.options.baseUrl + "/rest/api/1.0/projects/" + fetch.repository.project + "/repos?limit=100",
      headers: getAuthHeader()
    };
  };

  // @returns {*} an option object for use with <code>easyRequest.JSON</code> on each request to the STASH pull-request API
  function getJsonOptsForPullRequestApi(repositorySlug) {
    // url and optional auth header
    return {
      url: fetch.options.baseUrl + "/rest/api/1.0/projects/" + fetch.repository.project + "/repos/" + repositorySlug + "/pull-requests?order=NEWEST&limit=100",
      headers: getAuthHeader()
    };
  };

  function validateParams() {
    if (!fetch.options) { return 'missing options'; }
    if (!fetch.options.baseUrl) { return 'missing baseUrl in options: ' + JSON.stringify(fetch.options); }
    if (!fetch.repository.project) { return 'missing project field in repository: ' + JSON.stringify(fetch.repository); }
    
    return;
  }


  function getAllRepoPullRequests(repositories) {
  
    var requestPromises = [];

    for (var r = 0; r < repositories.length; r++) {
      requestPromises.push( getRepoPullRequests(getJsonOptsForPullRequestApi(repositories[r])) );
    }

    return q.all(requestPromises);

  }

};
