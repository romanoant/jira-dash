var async = require('async'),
    qs = require('querystring');

module.exports = function(config, dependencies, job_callback) {

  // fallback to for configuration compatibility
  var authName = config.authName || 'jac';

  if (!config.jira_server){
    return job_callback('jira_server config key not found');
  }

  if (!config.globalAuth || !config.globalAuth[authName] ||
    !config.globalAuth[authName].username || !config.globalAuth[authName].password){
    return job_callback('Authentication problems found in "issues-remaining" job. Please check config.globalAuth and authName attribute in widget configuration');
  }

  var logger = dependencies.logger;
  var maxResults = 200; // Dictated by the JAC server - we can't change this
  var baseUrl = config.jira_server + '/rest/api/2/search?';
  var clickUrl = config.jira_server + "/issues/?";
  var options = {
    headers: {
      "authorization": "Basic " + new Buffer(config.globalAuth[authName].username + ":" + config.globalAuth[authName].password).toString("base64")
    }
  };

  function query (jql, callback){
    var params = {
      jql: jql,
      maxResults: maxResults,
      fields: "key"
    };

    options.url = baseUrl + qs.stringify(params);

    dependencies.easyRequest.JSON(options, function(err, issueData) {
      if (err) {
        return callback(err);
      }

      if (issueData.issues == null || issueData.issues == undefined) {
        return callback('jira_server returned a malformed JSON response');
      }
      
      callback(null, {
        count: issueData.issues.length, 
        url: clickUrl + qs.stringify(params)
      });
      
    });
  }

  async.parallel(
    {
      open: function (callback) {
        query (config.jqlOpen, callback);
      },

      review: function (callback) {
        query (config.jqlReview, callback);
      }
    },
    function(err, results) {
      if (err){
        logger.error(err);
        return job_callback(err);
      }
      
      results.title = config.widgetTitle;
      results.openText = config.openText;
      results.reviewText = config.reviewText;
      results.maxResults = maxResults;
      job_callback(null, results);      
    }
  );
};
