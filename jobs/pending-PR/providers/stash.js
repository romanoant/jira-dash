
/**
 * Provider strategy for Stash
 * Expected output format:
 * [ { user: { username: iloire }, PR: 4 } ]
 */

module.exports = function(config, dependencies, repository, callback) { 

  function postProcessResponse (err, data) {
    if (err)
      return callback(err);

    if (!data || !data.values)
      return callback('no data');

    var users = [];
    for (var i = 0; i < config.team.length; i++) {
      var prs = 0;
      for (var d = 0; d < data.values.length; d++) {
        prs = prs + data.values[d].reviewers.filter(function(reviewer) { return reviewer.user.name === config.team[i].username && !reviewer.approved; }).length
      }
      users.push({ user : config.team[i], PR: prs });
    }
    return callback(null, users);
  }

  if (!repository.options) {
    return callback('missing options');
  }

  if (!repository.options.stashBaseUrl) {
    return callback('missing stashBaseUrl');
  }

  var options = {

    url: repository.options.stashBaseUrl + "/rest/api/1.0/projects/" + 
        repository.options.project + "/repos/" + repository.options.repository + 
        "/pull-requests?order=NEWEST&limit=100",

    headers: {
      "authorization": "Basic " + new Buffer(config.globalAuth.stash.username + ":" + config.globalAuth.stash.password).toString("base64")
    }
  };

  dependencies.easyRequest.JSON(options, postProcessResponse);
}