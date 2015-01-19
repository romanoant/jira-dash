var assert = require('assert');
var sinon = require('sinon');
var _ = require('underscore');
var SprintHealthJob = require('../sprinthealth');

describe('Sprint Health job', function () {

  var config;
  var mockDependencies;

  beforeEach(function (done) {
    config =  {
      'widgetTitle': 'Title',
      'credentials': 'jiraAuth',
      'jiraServer': 'https://your.jiraserver.com',
      'rapidViewId': 1
    };

    config.globalAuth = {
      jiraAuth: {
        username: 'myusername',
        password: 'secretpassword'
      }
    };

    mockDependencies = {
      easyRequest: {
        JSON: function (opts, callback) {
          var sprintData = {
            sprints:[
              {
                id: 1,
                name: 'Sprint One',
                state: 'CLOSED',
                linkedPagesCount: 0
              },
              {
                id: 2,
                name: 'Sprint Two',
                state: 'ACTIVE',
                linkedPagesCount: 0
              },
              {
                id: 3,
                name: 'Sprint Three',
                state: 'ACTIVE',
                linkedPagesCount: 0
              }
            ]
          };

          var sprintHealthData = {
            name: 'Sprint One',
            id: 1,
            timeRemaining: {
              days: 0
            },
            progress: {
              columns: [
                {
                  name: "Not Started",
                  value: 0
                },
                {
                  name: "In Progress",
                  value: 157
                },
                {
                  name: "Done",
                  value: 43
                }
              ]
            },
            issueMetrics: [
              {
                key: "blockers",
                value: 1
              },
              {
                key: "flagged",
                value: 0
              }
            ],
            sprintMetrics: [
              {
                key: "duration_completion_percentage",
                value: "100"
              },
              {
                key: "work_completion_percentage",
                value: "76"
              },
              {
                key: "scope_change_percentage",
                value: "100"
              }
            ]
          };

          if (opts.url.indexOf('sprintquery') > -1) {
            callback(null, sprintData);
          } else {
            callback(null, sprintHealthData);
          }
        }
      }
    };

    done();
  });


  // Test for correct config handling
  describe('Configuration', function () {

    it('should return an error without credentials', function (done) {
      delete config.credentials;

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'No JIRA credentials found for Sprint Health job. Please check global authentication file.');
        done();
      });
    });

    it('should return an error if configured credentials cannot be found', function (done) {
      config.credentials = 'notThere';

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'No JIRA credentials found for Sprint Health job. Please check global authentication file.');
        done();
      });
    });

    it('should return an error if configured credentials don\'t have a username', function (done) {
      delete config.globalAuth.jiraAuth.username;

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'No JIRA credentials found for Sprint Health job. Please check global authentication file.');
        done();
      });
    });

    it('should return an error if configured credentials don\'t have a password', function (done) {
      delete config.globalAuth.jiraAuth.password;

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'No JIRA credentials found for Sprint Health job. Please check global authentication file.');
        done();
      });
    });

    it('should return an error if no JIRA server is configured', function (done) {
      delete config.jiraServer;

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'No JIRA server configured for Sprint Health job.');
        done();
      });
    });

    it('should return an error if includeSprintPattern is specified but not a string', function (done) {
      config.includeSprintPattern = 123;

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'includeSprintPattern must be a string.');
        done();
      });
    });

    it('should return an error if no JIRA Agile board id is configured', function (done) {
      delete config.rapidViewId;

      var job = new SprintHealthJob(config, {}, function (err) {
        assert.ok(err);
        assert.equal(err, 'No RapidViewID configured for Sprint Health job.');
        done();
      });
    });

    it('should default compactDisplay to false if not configured', function (done) {

      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.equal(data.compactDisplay, false);
        done();
      });
    });

    it('should pass through the configured compactDisplay option', function (done) {
      config.compactDisplay = true;

      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.equal(data.compactDisplay, true);
        done();
      });
    });

  });

  // Test for correct sprint data retrieval
  describe('Sprint data retrieval', function () {

    it('should use the correct API url to retrieve list of sprints', function (done) {

      var spy = sinon.spy(mockDependencies.easyRequest, 'JSON');
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert(spy.firstCall.args[0].url.indexOf('/rest/greenhopper/1.0/sprintquery/1?') > -1);
        done();
      });
    });
  });

  describe('Sprint health data retrieval', function () {

    it('should use the correct API url to retrieve sprint health data', function (done) {

      var spy = sinon.spy(mockDependencies.easyRequest, 'JSON');
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert(spy.lastCall.args[0].url.indexOf('/gadgets/sprints/health?rapidViewId=1&sprintId=') > -1);
        done();
      });
    });
  });

  describe('Data processed for widget', function () {

    it('returns an object', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.ok(data);
        done();
      });
    });

    it('contains a legend', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.ok(data.legend);
        done();
      });
    });

    it('contains the widget title', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.equal(data.title, config.widgetTitle);
        done();
      });
    });

    it('contains the server url', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.ok(data.serverUrl);
        done();
      });
    });

    it('contains an array of sprints, one for each active sprint', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.equal(data.sprints.length, 2);
        done();
      });
    });

    it('contains an array of sprints, one for each active sprint which matches the specified pattern', function (done) {
      var job = new SprintHealthJob(_.extend({}, config, {includeSprintPattern: 'Two'}), mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.equal(data.sprints.length, 1);
        done();
      });
    });

    it('sprints contain column data', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);
        assert.equal(data.sprints[0].progress.columns.length, 3);
        done();
      });
    });

    it('sprint columns data have percentages that sum to 100%', function (done) {
      var job = new SprintHealthJob(config, mockDependencies, function (err, data) {
        assert.ifError(err);

        var totalProgress = _.reduce(data.sprints[1].progress.columns, function(memo, column) {
                return memo + column.percentage;
            }, 0);

        assert.equal(parseInt(totalProgress, 10), 100);
        done();
      });
    });
  });

});