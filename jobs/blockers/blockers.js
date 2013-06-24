var querystring = require('querystring'),
    cache = require('memory-cache');

module.exports = function(config, dependencies, job_callback) {

  if (!config.globalAuth || !config.globalAuth.jac ||
    !config.globalAuth.jac.username || !config.globalAuth.jac.password){
    return job_callback('non credentials found in blockers job. Please check config.globalAuth');
  }

  if (!config.jql || !config.jira_server){
    return job_callback('missing parameters in blockers job');
  }

  var teams = config.teams;
  var logger = dependencies.logger;

  var params = {
    jql: config.jql,
    maxResults: config.maxResults || 15,
    fields: "key,summary,assignee,components"
  };

  var options = {
    timeout: config.timeout || 15000,
    url: config.jira_server + '/rest/api/2/search?' + querystring.stringify(params),
    headers: {
      "authorization": "Basic " + new Buffer(config.globalAuth.jac.username + ":" +
          config.globalAuth.jac.password).toString("base64")
    }
  };

  // create link to display on the widget
  var linkParams = { jql: config.jql };
  var blockersLink = config.jira_server + "/issues/?" + querystring.stringify(linkParams);

  var cache_expiration = 60 * 1000; //ms
  var cache_key = 'atlassian-jira-blockers:config-' + JSON.stringify(config); // unique cache object per job config
  if (cache.get(cache_key)){
      return callback (null, cache.get(cache_key));
  }

  dependencies.request(options, function(error, response, blockerJSON) {
    if (error || !response || (response.statusCode != 200)) {
        var err_msg = (error || (response ? ("bad statusCode: " +
            response.statusCode) : "bad response")) + " from " + options.url;
        job_callback(err_msg);
    }
    else {
      var result = [];
      var blockerData;

      try {
        blockerData = JSON.parse(blockerJSON);
      }
      catch (err){
        var msg = 'error parsing JSON response from server';
        return job_callback(msg);
      }

      if (!blockerData.issues){
        blockerData.issues = [];
      }

      blockerData.issues.forEach(function(issue) {
        var baseUrl = issue.self.substring(0, issue.self.indexOf("/rest/api"));
        var issueKey = issue.key;
        var summary = issue.fields.summary;

        var assignee = issue.fields.assignee;
        var assigneeName = "Unassigned";
        var assigneeEmail = "";
        if (assignee !== null) {
            assigneeName = assignee.displayName;
            assigneeEmail = assignee.emailAddress;
        }

        var team = "Teamless Issue";
        var components = issue.fields.components;

        //loop through issue components trying to match it to a team
        components.forEach(function(component) {
          if (teams.indexOf(component.name) != -1) {
            team = component.name;
          }
        });

        result.push({
          url: baseUrl + "/browse/" + issueKey,
          issueKey: issueKey,
          summary: summary,
          assigneeName: assigneeName,
          assigneeEmail: assigneeEmail,
          team: team,
          down: false
        });
      });

      var data = {blockers: result, blockersLink: blockersLink};
      cache.put(cache_key, data, cache_expiration); //add to cache
      job_callback(null, data);
    }
  });
};
