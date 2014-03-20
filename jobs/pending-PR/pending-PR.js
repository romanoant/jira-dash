/**
 *
 * Job: pending-PR
 * Description: Display pending PR for a list of users (a team)
 *
 * Expected configuration:
 * 
 * { 
 *   "repositories": [
 *
 *     { 
 *       "name" : "confluence",   
 *       "provider": "STASH", 
 *
 *       "options": {
 *          "stashBaseUrl": "https://stash.atlassian.com", 
 *          "project": "CONF", 
 *          "repository": "confluence" 
 *       }
 *     }.
 *
 *     {
 *       "name" : "jira",
 *       "provider": "STASH", 
 *
 *       "options": {
 *          "stashBaseUrl": "https://stash.atlassian.com", 
 *          "project": "JIRA", 
 *          "repository": "jira" 
 *       }
 *     }
 *
 *   ],
 *
 *   "team": [
 *      { username: "iloire",  "display": "ivan", "email": "iloire@atlassian.com" }, // if email, related gravatar will be used. Otherwise, "display" property as a text
 *      { username: "dwillis", "display": "ivan", "email": "dwillis@atlassian.com" },
 *      { usernane: "mreis",   "display": "ivan", "email": "mreis@atlassian.com"}
 *   ],
 * }
 *
 *
 * Supported providers:
 * - STASH: Supported
 *
 *
 * Planned:
 * - Bitbucker provider support
 * - Ability to filter users by repositories.
 * - Ability to change the username by repository.
 *
 */


/**
 * Provider strategies
 */
var STRATEGIES = {
  STASH : function (config, dependencies, repository, callback) {
    require('./providers/stash')(config, dependencies, repository, callback);
  },

  BITBUCKET : function (config, dependencies, repository, callback) {
    throw 'no implemented';
  }
}

function parameterSanityCheck (config) {
  // parameter sanity check
  if (!config.globalAuth || !config.globalAuth.stash) {
    return 'missing credentials';
  }

  if (!config.team || !config.team.length) {
    return 'missing team';
  }

  if (!config.repositories || !config.repositories.length) {
    return 'missing repositories';
  }

  for (var i = 0; i < config.repositories.length; i++) {
    var repo = config.repositories[i];
    if (!repo.provider){
      return 'missing provider field in repository configuration';
    }
    if (!repo.options.project){
      return 'missing project field in repository configuration';
    }
    if (!repo.options.repository){
      return 'missing repository field in repository configuration';
    }
  }
}

function compactResults (entries) {
  var compactedResult = [];
  for (var i = 0; i < entries.length; i++) {
    var existentEntry = compactedResult.filter(function (entry) { return entry.user.username == entries[i].user.username;});
    if (existentEntry.length){
      existentEntry[0].PR = existentEntry[0].PR + entries[i].PR;
    }
    else {
      compactedResult.push(entries[i])
    }
  }
  return compactedResult;
}

module.exports = function(config, dependencies, job_callback) {

  function fetch (repository, callback) {
    if (STRATEGIES[repository.provider])
      STRATEGIES[repository.provider](config, dependencies, repository, callback);
    else 
      throw 'invalid strategy ' + repository.provider;
  }

  var inputErrors = parameterSanityCheck(config);
  if (inputErrors){
    return job_callback(inputErrors);
  }

  // fetch data and parse results
  dependencies.async.map(config.repositories, fetch, function (err, users){
    job_callback(err, err ? null : { users: compactResults(dependencies._.flatten(users)) });
  });
};
