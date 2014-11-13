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
 * - BITBUCKET: Supported
 *
 * Planned:
 * - Ability to filter users by repositories.
 *
 */


/**
 * Supported provider strategies.
 */
var STRATEGIES = (function() {
  return {
    STASH: requireProvider('stash'),
    BITBUCKET: requireProvider('bitbucket')
  };

  function requireProvider(name) {
    return function () {
      require('./providers/' + name).apply(this, arguments);
    };
  }
})();

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

module.exports = function(config, dependencies, job_callback, options) {
  var _ = dependencies['underscore'];
  options = _.defaults({}, options || {}, {
    strategies: STRATEGIES
  });

  /**
   * @param {object} request
   * @param {string} request.sourceId the name of the provider
   * @param {string} request.sourceType the type of provider (e.g. "STASH", "BITBUCKET")
   * @param {object} request.options provider-specific options object (gets passed to the strategy)
   * @param {object} request.repository provider-specific repository object (gets passed to the strategy)
   * @param {Function} callback
   */
  function fetchSingleRepo (request, callback) {
    var strategies = options.strategies;
    var sourceType = request.sourceType;
    if (strategies[sourceType]) {
      var fetch = {
        sourceId: request.sourceId,
        repository: request.repository,
        options: request.options,
        auth: config.globalAuth[request.sourceId],
        team: mapUserAliases(request.sourceId)
      };

      strategies[sourceType](fetch, dependencies, function(err, users) {
        // unmap user aliases before showing results
        callback(err, unmapUserAliases(request.sourceId, users));
      });
    }
    else
      throw 'invalid strategy ' + sourceType;
  }

  /**
   * Applies user aliases specified in the team config. This is done here so that each provider does not have to
   * worry about applying the aliases (the username they get is already the overridden one).
   *
   * @param {string} sourceId a source id
   * @returns {Array} an array of users with the overridden usernames
   */
  function mapUserAliases(sourceId) {
    return _.map(config.team, function(user) {
      var hasOverride = user.aliases && user.aliases[sourceId];

      // apply username aliases
      return _.extend({}, _.omit(user, 'aliases'), {
        username: hasOverride ? user.aliases[sourceId] : user.username
      });
    })
  }

  /**
   * Reverses the user aliases specified in the team config.
   *
   * @param {string} sourceId
   * @param {Array} users
   * @return {Array} an array of users with the original usernames restored
   */
  function unmapUserAliases(sourceId, users) {
    return _.map(users, function (entry) {
      // restore the original username
      var override = _.find(config.team, function (u) {
        return u.aliases && u.aliases[sourceId] && u.aliases[sourceId] === entry.user.username;
      });

      return _.extend({}, entry, { user: override || entry.user });
    });
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
    job_callback(err, err ? null : {
      title: config.title || '',
      users: compactResults(_.flatten(users)),
      widget: _.defaults({}, config.widget, {
        showZeroCounts: false,
        useProportionalAvatars: true
      })
    });
  });
};
