/**
 * Job: pending-PR
 *
 * Expected configuration:
 * 
 * { 
 *   "stashBaseUrl": "https://stash.atlassian.com",
 *   "repositories": [
 *     { project: "CONF", repository: "confluence" }
 *   ],
 *   "team": [
 *     "iloire", "dwillis"
 *   ]
 * }
 */

/**
 * Filters PR by an specific username
 * @param  {array} array of entries
 * @param  {string} username
 * @return {array}  entries for that particular username
 */
function getPRByUser(data, username) {
  var listPRs = [];
  for (var i = 0; i < data.values.length; i++) {
    var pr = data.values[i];
    if (pr.author.user.name == username){
      listPRs.push (pr);
    }
  }
  return listPRs;
}

module.exports = function(config, dependencies, job_callback) {

function compactResultsByUser (data){
  var users = [];
  for (var i = 0; i < config.team.length; i++) {
    var prs = [];
    for (var d = 0; d < data.length; d++) {
      prs = prs.concat(getPRByUser (data[d], config.team[i]));
    }
    var entry = {
      name : config.team[i],
      PR: prs
    };
    users.push(entry);
  }
  return users;
}


  function fetchPRByProjectAndRepository(repository, callback) {
    var options = {
      url: config.stashBaseUrl + "/rest/api/1.0/projects/" + repository.project + "/repos/" + repository.repository + "/pull-requests?order=NEWEST",
      headers: {
        "authorization": "Basic " + new Buffer(config.globalAuth.stash.username + ":" + config.globalAuth.stash.password).toString("base64")
      }
    };

    dependencies.easyRequest.JSON(options, callback);
  }

  var logger = dependencies.logger;
  var _ = dependencies._;

  if (!config.globalAuth || !config.globalAuth.stash) {
    return job_callback('missing credentials');
  }

  if (!config.team || !config.team.length) {
    return job_callback('missing team');
  }

  if (!config.repositories || !config.repositories.length) {
    return job_callback('missing repositories');
  }

  if (!config.stashBaseUrl ) {
    return job_callback('missing stashBaseUrl');
  }

  for (var i = 0; i < config.repositories.length; i++) {
    var repo = config.repositories[i];
    if (!repo.project || !repo.repository){
      return job_callback('missing field in repositories list');
    }
  }

  dependencies.async.map(config.repositories, fetchPRByProjectAndRepository, function (err, results){
    if (err){
      job_callback(err);
    }
    else {
      job_callback(null, { users: compactResultsByUser(results) });
    }
  });
};
