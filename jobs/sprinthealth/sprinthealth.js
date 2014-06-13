/**
 * Job: Sprint Health
 *
 * Expected configuration:
 *
 *  {
 *      "credentials": "jiraAuth", // username/password config key from your globalAuth file
 *      "jiraServer": "https://your.jiraserver.com",
 *      "rapidViewId": 561, // ID of your board in JIRA Agile (have a look in your board URL)
 *      "widgetTitle": "Sprint Health"
 *  }
 */

 var async = require('async');
 var _ = require('underscore');

module.exports = function(config, dependencies, job_callback) {

    var credentials = config.credentials;

    if (!config.globalAuth || !config.globalAuth[credentials] || !config.globalAuth[credentials].username || !config.globalAuth[credentials].password) {
        return job_callback('No JIRA credentials found for Sprint Health job. Please check global authentication file.');
    }

    if (!config.jiraServer) {
        return job_callback('No JIRA server configured for Sprint Health job.');
    }

    if (!config.rapidViewId || typeof config.rapidViewId !== 'number') {
        return job_callback('No RapidViewID configured for Sprint Health job.');
    }

    var baseUrl = config.jiraServer + '/rest/greenhopper/1.0';
    var sprintListUrl = baseUrl + '/sprintquery/' + config.rapidViewId + '?includeFutureSprints=false';
    var sprintHealthUrl = baseUrl + '/gadgets/sprints/health?rapidViewId=' + config.rapidViewId + '&sprintId=';
    var options = {
        headers: {
            'Authorization': 'Basic ' + new Buffer(config.globalAuth[credentials].username + ':' + config.globalAuth[credentials].password).toString('base64')
        }
    };

    function calculateColumnDistribution(sprints) {
        _.each(sprints, function(sprint) {
            var columns = sprint.progress.columns;
            var scope = _.reduce(columns, function(memo, column) {
                return memo + column.value;
            }, 0);
            _.each(columns, function(column) {
                column.percentage = ((column.value / scope) || 0) * 100;
            });
        });

        return sprints;
    }

    function getSprintHealthData(sprintId, callback) {
        dependencies.easyRequest.JSON(_.extend({}, options, {
            url: sprintHealthUrl + sprintId
        }), callback);
    }

    function getActiveSprintsOnBoard(err, data) {
        if (err) return job_callback('Could not retrieve Sprint data from Agile Board.');

        var activeSprints = _.pluck(_.where(data.sprints, {
            state: 'ACTIVE'
        }), 'id');

        async.map(activeSprints, getSprintHealthData, function(err, sprints) {
            if (err) return job_callback('Could not retrieve Sprint Health data from Agile Board.');

            job_callback(null, {
                title: config.widgetTitle,
                sprints: calculateColumnDistribution(sprints),
                serverUrl: config.jiraServer,
                legend: {
                    duration_completion_percentage: 'Time elapsed',
                    work_completion_percentage: 'Work complete',
                    scope_change_percentage: 'Scope change',
                    blockers: 'Blockers',
                    flagged: 'Flagged'
                }
            });
        });

    }

    // Get all the active sprints on the board
    dependencies.easyRequest.JSON(_.extend({}, options, {
        url: sprintListUrl
    }), getActiveSprintsOnBoard);
};