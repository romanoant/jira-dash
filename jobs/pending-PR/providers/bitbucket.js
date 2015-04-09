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
  var _ = dependencies.underscore;
  var q = require('q');

  var bitbucketBaseUrl = 'https://bitbucket.org/api/2.0/repositories/' + encodeURIComponent(fetch.repository.org);

  var getJSON = q.nbind(dependencies.easyRequest.JSON, dependencies.easyRequest);

  var users = _.object(_.map(fetch.team, function (user) {
      return [ user.username, { 'PRs': 0, 'display': user.display, 'email': user.email } ];
  }));

  var validationError = validateParams();
  if(validationError) {
    return callback('error in source "' + fetch.sourceId + '": ' + validationError);
  }

  getRepoNames()
    .then(function(repositories) { return getAllRepoPullRequests(repositories); })
    .then(function() { callback(null, formatResponse(users)); } )
    .fail(function(err) { callback(err); } )
    .done();

  function formatResponse(users) {
    return _.map(users, function(value, key) {
        var tuple = { user: { username: key}, PR: value.PRs };
        if(value.display) {
         tuple.user.display = value.display;
        }
        if(value.email) {
          tuple.user.email = value.email;
        }
        return tuple;
    });
  }

  function getRepoNames() {

    var deferred = q.defer();

    // If repo name is supplied, use that, otherwise get all from the project
    if (fetch.repository.repository) {
      return q.when([fetch.repository.repository]);
    } else {

      var repoUrl = bitbucketBaseUrl + '?pagelen=100';
      getJSON({ url: repoUrl, headers: getAuthHeader() })
        .then(function(data) {
          if (!(data && data.values)){
            return deferred.reject('no data');
          }
          return deferred.resolve(_.map(data.values, function (datavalues) {
           return datavalues.name;
          }));
        })
        .fail(function(err) {
          return deferred.reject(err);
        });

    }

    return deferred.promise;

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
   * @param {Object} deferred deferred promise to resolve on recursion completion
   * @param {Array} [pullRequests]
   * @returns {*}
   */
  function processPrList(nextPageUrl, deferred, pullRequests) {

    if (!nextPageUrl) {
      // if there are no more pages then proceed to process each PR
      return processRemainingPrs(pullRequests, deferred);
    }

    pullRequests = pullRequests || [];
    
    getJSON({ url: nextPageUrl, headers: getAuthHeader() }).then(function (data) {

      if (!data || !data.values) {
        return deferred.reject('no PRs in list: ' + nextPageUrl);
      } 

      if(data.values.length === 0) {
        return deferred.resolve();
      } else {
        // otherwise recurse until we have built up a list of all PRs
        processPrList(data.next, deferred, _.union(pullRequests, data.values));
      }    
    })
    .fail(function(err) {
        return deferred.reject(err);
    });

  }

  /**
   * Recursively fetches PR reviewers, accumulating the results in <code>users</code>, and calls <code>callback</code>
   * when done.
   *
   * @param {Array} remainingPRs an array of pull requests
   * @param {Object} deferred deferred promise to resolve on recursion completion
   * @returns {*}
   */
  function processRemainingPrs(remainingPRs, deferred) {

    // return once all PRs have been processed
    if (remainingPRs.length === 0) {
      return deferred.resolve();
    }

    // otherwise fetch a single PR at a time
    var pullRequestUrl = remainingPRs[0].links.self.href;
    getJSON({ url: pullRequestUrl, headers: getAuthHeader() }).then(function(data) {

      if (!data) {
        return deferred.reject('no PR in: ' + pullRequestUrl);
      }

      _.each(data.participants, function (participant) {
        var username = participant.user.username;
        if (!participant.approved && !_.isUndefined(users[username]) && username !== data.author.username) {
          // +1 for each unapproved PR
          users[username].PRs += 1;
        }
      })

      // recurse until all PRs have been processed
      processRemainingPrs(remainingPRs.slice(1), deferred);

    })      
    .fail(function(err) {
        return deferred.reject(err);
    });

  }

  function getAllRepoPullRequests(repositories) {
  
    var requestPromises = [];

    for (var r = 0; r < repositories.length; r++) {
      var page1 = bitbucketBaseUrl
                 + '/' + encodeURIComponent(repositories[r])
                 + '/pullrequests?state=OPEN';
      var deferred = q.defer();
      processPrList(page1, deferred);
      requestPromises.push(deferred.promise);
    }

    return q.all(requestPromises);

  }

};
