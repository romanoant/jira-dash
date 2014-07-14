/**
+
+  JIRA blockers
+
+  Example config:
+
+    "confluence-blockers" : {
+      "timeout": 30000,
+      "retryOnErrorTimes" : 3,
+      "interval" : 120000,
+      "jira_server" : "https://jira.atlassian.com",
+      "useComponentAsTeam" : true,
+      "projectTeams": {
+        "CONFDEV": "Teamless Issue",
+        "CONFVN": "Vietnam"
+      },
+      "highLightTeams" : ["Editor"]    
+      "jql" : "(project in (\"CONFDEV\",\"CONFVN\") AND resolution = EMPTY AND priority = Blocker) OR (project = \"CONF\" AND resolution = EMPTY AND priority = Blocker AND labels in (\"ondemand\"))"
+    },
+
+*/

var querystring = require('querystring'),
    cache = require('memory-cache');


function getBlockingAreas(config, issue){
  var blockingAreas = [];
  var keyword = "blocking-";
  if (issue.fields.labels){
    issue.fields.labels.forEach(function(label) {
      var i = label.indexOf(keyword);
      if (i > -1){
        blockingAreas.push(label.substr(keyword.length));
      }
    });
  }
  return blockingAreas;
}

function fillIssueWithTeamInfo(config, issue){
  
  var projectKey = issue.key.split('-')[0];

  var projectTeams = config.projectTeams || {};
  var team = projectTeams[projectKey] || "Teamless Issue"; // default value

  //loop through issue components trying to match it to a team
  issue.fields.components.forEach(function(component) {
    if(config.useComponentAsTeam) {
      team = component.name;
    } else {
      var teams = config.teams || [];
      if (teams.indexOf(component.name) != -1) {
        team = component.name;
      }
    }
  });

  // highlight our teams according to config
  var highlighted = false;
  if (config.highLightTeams) {
    for (var i = 0; i < config.highLightTeams.length; i++) {
      if (config.highLightTeams[i] === team){
        highlighted = true;
        break;
      }
    }
  }

  return {
    name: team,
    highlighted: highlighted
  };
}


module.exports = function(config, dependencies, job_callback) {

  // fallback to for configuration compatibility
  var authName = config.authName || 'jac';

  if (!config.globalAuth || !config.globalAuth[authName] ||
    !config.globalAuth[authName].username || !config.globalAuth[authName].password){
    return job_callback('no credentials found in blockers job. Please check global authentication file (usually config.globalAuth)');
  }

  if (!config.jql || !config.jira_server){
    return job_callback('missing parameters in blockers job');
  }

  var logger = dependencies.logger;

  var params = {
    jql: config.jql,
    maxResults: config.maxResults || 15,
    fields: "key,summary,assignee,components,labels"
  };

  var options = {
    timeout: config.timeout || 15000,
    url: config.jira_server + '/rest/api/2/search?' + querystring.stringify(params),
    headers: {
      "authorization": "Basic " + new Buffer(config.globalAuth[authName].username + ":" +
          config.globalAuth[authName].password).toString("base64")
    }
  };

  // create link to display on the widget
  var linkParams = { jql: config.jql };
  var blockersLink = config.jira_server + "/issues/?" + querystring.stringify(linkParams);

  // cache response
  var cache_expiration = 60 * 1000; //ms
  var cache_key = 'atlassian-jira-blockers:config-' + JSON.stringify(config); // unique cache object per job config
  if (cache.get(cache_key)){
      return job_callback (null, cache.get(cache_key));
  }

  dependencies.easyRequest.JSON(options, function(error, blockerData) {
    if (error)
        return job_callback(error);

    var result = [];

    if (!blockerData.issues)
      blockerData.issues = [];

    blockerData.issues.forEach(function(issue) {
      var baseUrl = issue.self.substring(0, issue.self.indexOf("/rest/api"));
      var assignee = issue.fields.assignee;

      var teamInfo = fillIssueWithTeamInfo(config, issue);

      result.push({
        url: baseUrl + "/browse/" + issue.key,
        issueKey: issue.key,
        summary: issue.fields.summary,
        unassigned : !issue.fields.assignee,
        assigneeName: assignee ? assignee.displayName : "Unassigned",
        assigneeEmail: assignee ? assignee.emailAddress : "",
        team: teamInfo.name,
        highlighted: teamInfo.highlighted,
        blocking: getBlockingAreas(config, issue),
        down: false
      });
    });

    // unassigned and highlighted blockers first
    result.sort(function(a, b){ 
      if ((a.unassigned && b.unassigned) || (!a.unassigned && !b.unassigned)) {
        return a.highlighted < b.highlighted   
      }
      return a.unassigned < b.unassigned 
    });

    var data = { 
      blockers: result, 
      blockersLink: blockersLink
    };

    cache.put(cache_key, data, cache_expiration);

    job_callback(null, data);

  });
}