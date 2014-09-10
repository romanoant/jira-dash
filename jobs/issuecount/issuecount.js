/*
  Issue count job

      "issuecount" : {
          "interval" : 300000,
          "title": "Open Feedback Issues",
          "jiraServer": "https://jira.atlassian.com",
          "sections" : [
              {
                  "title": "Global",
                  "counts": [
                      {
                          "label": "General (EAC & PUG)",
                          "jql": "project = CONFDEV AND issuetype = Feedback AND component NOT IN (\"KL Plugin Dev\",\"Notifications\",\"User Experience\",\"Supersonic Hedgehogs\", \"Editor\", \"ADG\", \"Enterprise\", \"Collaboration Cycle\", \"Blueprints\", \"EAC/PUG Champion\") AND status NOT IN (closed, resolved) ORDER BY created DESC"
                      }
                  ]
              },
              {
                  "title": "Themes",
                  "counts": [
                      {
                          "label": "Collab Cycle",
                          "jql": "project = CONFDEV AND issuetype = Feedback AND component = \"Collaboration Cycle\" AND status NOT IN (closed, resolved) ORDER BY created DESC"
                      },
                      {
                          "label": "Enterprise",
                          "jql": "project = CONFDEV AND issuetype = Feedback AND component = \"Enterprise\" AND status NOT IN (closed, resolved) ORDER BY created DESC"
                      },
                      {
                          "label": "ADG",
                          "jql": "project = CONFDEV AND issuetype = Feedback AND component = \"ADG\" AND status NOT IN (closed, resolved) ORDER BY created DESC"
                      }
                  ]
              }
          ]
      },
*/

var async = require('async'),
    qs = require('querystring');

module.exports = function (config, dependencies, job_callback) {

  // fallback to for configuration compatibility
  var authName = config.authName || 'jac';

  if (!config.globalAuth || !config.globalAuth[authName] ||
    !config.globalAuth[authName].username || !config.globalAuth[authName].password) {
    return job_callback('no JIRA credentials found in issuecount job. Please check global authentication file');
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


  // queries a single item
  function issueCountProcessor (item, cb) {
    if (!(item.jql && item.jql.trim().length)) {
      return cb(null, {label: item.label, item: 0});
    }
    options.url = baseUrl + qs.stringify({jql: item.jql, maxResults: 200});

    dependencies.easyRequest.JSON(options, function(err, data) {
      
      var ret = {
        label: item.label, 
        url: clickUrl + qs.stringify({jql: item.jql})
      };

      if (err) {
        logger.error("error processing " + item.label + ": " + err);
        ret.error = err;
      } else {
        ret.count = data.issues.length;
      }

      cb(null, ret);
    });
  }

  function sectionProcessor (section, cb) {
    // process each item
    async.map(section.counts, issueCountProcessor, function(err, issues) {
      cb(null, {title: section.title, counts: issues});
    })
  }

  // process each section
  async.map(config.sections, sectionProcessor, function(err, sections) {
    job_callback(null, {title: config.title, sections: sections});
  });
};
