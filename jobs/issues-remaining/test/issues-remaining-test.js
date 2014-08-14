var assert = require('assert');
var issuesRemaining = require('../issues-remaining');
var qs = require('querystring');

// mocks
var mockedConfig, mockedDependencies, mockedOpenData, mockedReviewData, mockedAllData;

beforeEach(function(done){

  mockedConfig = {

    //widget config
    jira_server: "https://jira.atlassian.com",
    authName: "confluence",
    retryOnErrorTimes: 3,
    interval: 120000,
    jqlOpen: "project = CONF AND filter = \"All Editor CONF issues\" AND type = bug AND labels = warranty AND Resolution is EMPTY",
    jqlReview: "project = CONF AND filter = \"All Editor CONF issues\" AND type = bug AND labels = warranty AND Resolution = Fixed and updated > -14d",
    widgetTitle: "Warranty",
    openText: "Unresolved Warranty",
    reviewText: "Resolved Warranty",

    //globalAuth config
    globalAuth: {
      "confluence" : {
        "username" : "confluence_username",
        "password" : "confluence_password"
      }
    }

  };

  mockedDependencies = {
    easyRequest: {
      JSON : function (options, callback) {

        var openParams = {
          jql: mockedConfig.jqlOpen
        };
        var reviewParams = {
          jql: mockedConfig.jqlReview
        };

        var jqlOpenUrl = qs.stringify(openParams)
        var jqlReviewUrl = qs.stringify(reviewParams)

        if (mockedConfig.jqlOpen && options.url.indexOf(jqlOpenUrl) > -1) {
          return callback (null, mockedOpenData);
        } 

        if (mockedConfig.jqlReview && options.url.indexOf(jqlReviewUrl) > -1) {
          return callback (null, mockedReviewData);
        }

        return callback (null, mockedAllData);

      }
    },

    logger: {
      log : function(input) {},
      error : function(input) {}
    }

  };

  mockedOpenData = {
    "issues": ["O-1", "O-2", "O-3"]
  };

  mockedReviewData = {
    "issues": ["R-1", "R-2"]
  };

  mockedAllData = {
    "issues": ["O-1", "O-2", "O-3", "R-1", "R-2"]
  };

  done();

});

describe('issues-remaining', function() {

  describe('happy path', function() {

    it('should pass if config and globalAuth are present, correct and coordinated', function (done) {

      //This is the default case under the general config provided above

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.open.count == mockedOpenData.issues.length);
        assert.ok(data.review.count == mockedReviewData.issues.length);
        done();
      });

    });

  });

  describe('auth config', function() {

    it('should pass if globalAuth is present and authName refers to it', function (done) {

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if authName is missing but globalAuth refers to jac (default value)', function (done) {

      delete mockedConfig.authName;

      mockedConfig.globalAuth = {
        "jac" : {
          "username" : "jac_username",
          "password" : "jac_password"
        }
      };

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should fail if globalAuth is missing', function (done) {

      delete mockedConfig.globalAuth;

      issuesRemaining(mockedConfig, mockedDependencies, function(err) {
        assert.ok(err == 'Authentication problems found in "issues-remaining" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

    it('should fail if globalAuth is empty', function (done) {

      mockedConfig.globalAuth = {};

      issuesRemaining(mockedConfig, mockedDependencies, function(err) {
        assert.ok(err == 'Authentication problems found in "issues-remaining" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

    it('should fail if globalAuth has no username', function (done) {

      delete mockedConfig.globalAuth.confluence.username

      issuesRemaining(mockedConfig, mockedDependencies, function(err) {
        assert.ok(err == 'Authentication problems found in "issues-remaining" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

    it('should fail if globalAuth has no password', function (done) {

      delete mockedConfig.globalAuth.confluence.password

      issuesRemaining(mockedConfig, mockedDependencies, function(err) {
        assert.ok(err == 'Authentication problems found in "issues-remaining" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

  });

  describe('mandatory / optional config', function() {

    it('should fail if jira_server is missing', function (done) {

      delete mockedConfig.jira_server;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err == 'jira_server config key not found');
        done();
      });

    });

    it('should use the custom title provided in the config', function (done) {

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.title == mockedConfig.widgetTitle);
        done();
      });

    });

    it('should pass if the custom title is not provided in the config', function (done) {

      delete mockedConfig.widgetTitle;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should use the custom title provided in the config for the open section', function (done) {

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.openText == mockedConfig.openText);
        done();
      });

    });

    it('should pass if the custom title for the open section is not provided in the config', function (done) {

      delete mockedConfig.openText;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should use the custom title provided in the config for the review section', function (done) {

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.reviewText == mockedConfig.reviewText);
        done();
      });

    });

    it('should pass if the custom title for the review section is not provided in the config', function (done) {

      delete mockedConfig.reviewText;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    }); 

    it('should pass if retryOnErrorTimes is missing', function (done) {

      delete mockedConfig.retryOnErrorTimes;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if interval is missing', function (done) {

      delete mockedConfig.interval;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if jqlOpen is missing, returning all issues, without affecting review results', function (done) {

      //Default JIRA API behaviour, no jql passed means return all issues in the server

      delete mockedConfig.jqlOpen;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.open.count == mockedAllData.issues.length);
        assert.ok(data.review.count == mockedReviewData.issues.length);
        assert.ifError(err);
        done();
      });

    });

    it('should pass if jqlReview is missing, returning all issues, without affecting open results', function (done) {

      //Default JIRA API behaviour, no jql passed means return all issues in the server

      delete mockedConfig.jqlReview;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.open.count == mockedOpenData.issues.length);
        assert.ok(data.review.count == mockedAllData.issues.length);
        assert.ifError(err);
        done();
      });

    });

  });

  describe('wrong config', function() {

    it('should fail if jira_server is present but empty', function (done) {

      mockedConfig.jira_server = "";

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err);
        done();
      });

    });  

    it('should pass if retryOnErrorTimes has the wrong type', function (done) {

      mockedConfig.retryOnErrorTimes = "string";

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if interval has the wrong type', function (done) {

      mockedConfig.interval = "string";

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if the custom title provided in the config has the wrong type', function (done) {

      mockedConfig.widgetTitle = 1;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if the custom title for the open section has the wrong type', function (done) {

      mockedConfig.openText = 1;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should pass if the custom title for the review section has the wrong type', function (done) {

      mockedConfig.reviewText = 1;

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

  });

  describe('unhappy paths', function() {

    it('should pass if it gets 0 issues from queries', function (done) {

      mockedOpenData.issues = [];
      mockedReviewData.issues = [];

      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(data.open.count == mockedOpenData.issues.length);
        assert.ok(data.review.count == mockedReviewData.issues.length);
        done();
      });

    }); 

    it('should fail if the query for open data returns nothing', function (done) {

      delete mockedOpenData.issues;
    
      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err == 'jira_server returned a malformed JSON response');
        done();
      });

    }); 

    it('should fail if the query for review data returns nothing', function (done) {

      delete mockedReviewData.issues;
    
      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err == 'jira_server returned a malformed JSON response');
        done();
      });

    }); 

    it('should fail if the query for open data returns null', function (done) {

      mockedOpenData.issues = null;
    
      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err == 'jira_server returned a malformed JSON response');
        done();
      });

    }); 

    it('should fail if the query for review data returns nothing', function (done) {

      mockedReviewData.issues = null;
    
      issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err == 'jira_server returned a malformed JSON response');
        done();
      });

    }); 

  });

});