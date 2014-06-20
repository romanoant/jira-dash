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
  var jsonOpts = getJsonOpts();
  if (typeof jsonOpts === 'string') {
    return callback('error in source "' + fetch.sourceId + '": ' + jsonOpts);
  }

  dependencies.easyRequest.JSON(jsonOpts, onJsonResponse);

  /**
   * @returns {*} an option object for use with <code>easyRequest.JSON</code> or a <code>string<code> if there's an error
   */
  function getJsonOpts() {
    if (!fetch.options) { return 'missing options'; }
    if (!fetch.options.baseUrl) { return 'missing baseUrl in options: ' + JSON.stringify(fetch.options); }
    if (!fetch.repository.project) { return 'missing project field in repository: ' + JSON.stringify(fetch.repository); }
    if (!fetch.repository.repository) { return 'missing repository field in repository: ' + JSON.stringify(fetch.repository); }

    // url and optional auth header
    return {
      url: fetch.options.baseUrl + "/rest/api/1.0/projects/" + fetch.repository.project + "/repos/" + fetch.repository.repository + "/pull-requests?order=NEWEST&limit=100",
      headers: fetch.auth ? { "authorization": "Basic " + new Buffer(fetch.auth.username + ":" + fetch.auth.password).toString("base64") } : undefined
    };
  }

  function onJsonResponse(err, data) {
    if (err)
      return callback(err);

    if (!data || !data.values)
      return callback('no data');

    var users = [];
    for (var i = 0; i < fetch.team.length; i++) {
      var prs = 0;
      for (var d = 0; d < data.values.length; d++) {
        prs = prs + data.values[d].reviewers.filter(function (reviewer) {
          return reviewer.user.name === fetch.team[i].username && !reviewer.approved;
        }).length
      }
      users.push({ user: fetch.team[i], PR: prs });
    }
    return callback(null, users);
  }
};
