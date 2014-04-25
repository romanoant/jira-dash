var async = require('async'),
    qs = require('querystring');

module.exports = function (config, dependencies, job_callback) {

  // fallback to for configuration compatibility
  var authName = config.authName || 'jac';

  if (!config.globalAuth || !config.globalAuth[authName] ||
    !config.globalAuth[authName].username || !config.globalAuth[authName].password) {
    return job_callback('no JIRA credentials found in buildoverview job. Please check global authentication file');
  }

  if (!config.jiraServer) {
      return job_callback("No JIRA server configured");
  }

  var logger = dependencies.logger;

  var baseUrl = config.jiraServer + '/rest/api/2/search?';
  var clickUrl = config.jiraServer + "/issues/?";
  var options = {
    headers: {
      "authorization": "Basic " + new Buffer(config.globalAuth[authName].username
        + ":" + config.globalAuth[authName].password).toString("base64")
    }
  };

  async.map(config.sections, function(section, sectionCallback) {
    async.map(section.counts, function(count, issueCountCallback) {

      if (!(count.jql && count.jql.trim().length)) {
        return issueCountCallback(null, {label: count.label, count: 0});
      }

      options.url = baseUrl + qs.stringify({jql: count.jql, maxResults: 200});

      dependencies.easyRequest.JSON(options, function(err, issues) {

        if (err) {
          logger.error(err);
          issueCountCallback(err);
        } else {
          issueCountCallback(null, {
            label: count.label, 
            count: issues.issues.length, 
            url: clickUrl + qs.stringify({jql: count.jql})
          });
        }

      });
    }, function(err, issueCounts) {
      sectionCallback(err, {title: section.title, counts: issueCounts});
    })
  }, function(err, sections) {
    job_callback(err, {title: config.title, sections: sections});
  });
};
