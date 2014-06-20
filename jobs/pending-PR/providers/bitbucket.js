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

  var opts = parseOptions();
  if (typeof opts === 'string') {
    return callback('error in source "' + fetch.sourceId + '": ' + opts);
  }

  // kick things off by fetching the first page of PRs
  processPrList(opts.page1);

  /**
   * Wrapper around easyRequest.JSON that adds authentication headers.
   */
  function getJSON(url, callback) {
    return dependencies.easyRequest.JSON({ url: url, headers: opts.headers }, callback);
  }

  /**
   * @returns {*} an option object for use with <code>easyRequest.JSON</code> or a <code>string<code> if there's an error
   */
  function parseOptions() {
    if (!fetch.repository.org) return 'missing org field in repository: ' + JSON.stringify(fetch.repository);
    if (!fetch.repository.repository) return 'missing repository field in repository: ' + JSON.stringify(fetch.repository);

    // url and optional auth header
    return {
      page1: "https://bitbucket.org/api/2.0/repositories/" + encodeURIComponent(fetch.repository.org) + "/" + encodeURIComponent(fetch.repository.repository) + "/pullrequests?state=OPEN",
      headers: fetch.auth ? { "authorization": "Basic " + new Buffer(fetch.auth.username + ":" + fetch.auth.password).toString("base64") } : undefined
    }
  }

  /**
   * Fetches list of pull requests and processes each one, counting the pending PRs.
   *
   * @param {string} nextPageUrl
   * @param {Array} [pullRequests]
   * @returns {*}
   */
  function processPrList(nextPageUrl, pullRequests) {
    if (!nextPageUrl) {
      // if there are no more pages then proceed to process each PR
      return processRemainingPrs(pullRequests);
    }

    pullRequests = pullRequests || [];
    getJSON(nextPageUrl, function (err, data) {
      if (err) return callback(err);
      if (!data || !data.values) return callback('no PRs in list: ' + nextPageUrl);

      // otherwise recurse until we have built up a list of all PRs
      processPrList(data.next, _.union(pullRequests, data.values));
    });
  }

  /**
   * Recursively fetches PR reviewers, accumulating the results in <code>users</code>, and calls <code>callback</code>
   * when done.
   *
   * @param {Array} remainingPRs an array of pull requests
   * @param {object} users a hash containing each user's PR count (key is the username)
   * @returns {*}
   */
  function processRemainingPrs(remainingPRs, users) {
    // seed the users param with zero counts for each user in the team, e.g. { "luis": 0 }
    users = users || _.object(_.map(fetch.team, function (user) {
      return [ user.username, 0 ];
    }));

    // return once all PRs have been processed
    if (remainingPRs.length === 0) {
      return callback(null, _.map(users, function(value, key) {
        // map to the desired output format
        return { user: { username: key }, PR: value };
      }))
    }

    // otherwise fetch a single PR at a time
    var pullRequestUrl = remainingPRs[0].links.self.href;
    getJSON(pullRequestUrl, function (err, data) {
      if (err) return callback(err);
      if (!data) return callback('no PR in: ' + pullRequestUrl);

      _.each(data.participants, function (participant) {
        var username = participant.user.username;
        if (!participant.approved && !_.isUndefined(users[username]) && username !== data.author.username) {
          // +1 for each unapproved PR
          users[username] = users[username] + 1;
        }
      });

      // recurse until all PRs have been processed
      processRemainingPrs(remainingPRs.slice(1), users);
    });
  }
};
