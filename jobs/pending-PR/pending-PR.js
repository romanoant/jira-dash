/**
 *
 * Job: pending-PR
 * Description: Display pending PR for a list of users (a team)
 *
 * Expected configuration: see README.md.
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

/**
 * Parameter sanity check.
 *
 * @param config
 * @returns {string} if there's an error, <code>undefined</code> otherwise
 */
function parameterSanityCheck (config) {
  if (!config.team || !config.team.length) {
    return 'missing team';
  }

  if (config.repositories) {
    return "top-level 'repositories' has been replaced with 'servers'. Check README.md for new configuration format";
  }

  if (!config.servers) {
    return 'missing servers';
  }

  for (var sourceId in config.servers) {
    if (config.servers.hasOwnProperty(sourceId)) {
      var source = config.servers[sourceId];

      if (!source.provider) {
        return "missing provider for source: " + sourceId
      }

      if (!source.repositories || !source.repositories.length) {
        return "missing repositories for source: " + sourceId
      }
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
  var _ = dependencies['underscore'];

  /**
   * @param {object} request
   * @param {string} request.sourceId the name of the provider
   * @param {string} request.sourceType the type of provider (e.g. "STASH", "BITBUCKET")
   * @param {object} request.options provider-specific options object (gets passed to the strategy)
   * @param {object} request.repository provider-specific repository object (gets passed to the strategy)
   * @param {Function} callback
   */
  function fetchSingleRepo (request, callback) {
    var sourceType = request.sourceType;
    if (STRATEGIES[sourceType]) {
      var fetch = {
        sourceId: request.sourceId,
        repository: request.repository,
        options: request.options,
        auth: config.globalAuth[request.sourceId]
      };

      STRATEGIES[sourceType](fetch, config.team, dependencies, callback);
    }
    else
      throw 'invalid strategy ' + sourceType;
  }

  var inputErrors = parameterSanityCheck(config);
  if (inputErrors){
    return job_callback(inputErrors);
  }

  // "flatMap" the config structure into multiple "strategy request" objects
  var repos = _.flatten(_.map(config.servers || [], function(sourceConfig, sourceName) {
    return _.map(sourceConfig.repositories, function(repository) {
      // a single 'repository' config that will be passed to the provider strategy
      return {
        sourceId: sourceName,
        sourceType: sourceConfig.provider,
        options: sourceConfig.options,
        repository: repository
      };
    });
  }), true);

  // fetch data and parse results
  dependencies.async.map(repos, fetchSingleRepo, function (err, users){
    job_callback(err, err ? null : { title: config.title || '', users: compactResults(dependencies.underscore.flatten(users)) });
  });
};
