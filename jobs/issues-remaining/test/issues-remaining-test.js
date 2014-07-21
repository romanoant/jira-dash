var assert = require('assert');
var issuesRemaining = require('../issues-remaining');

// mocks
var mockedConfig, mockedDependencies, mockedData;

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
        		callback (null, mockedData);
      		}
    	}
    };

    mockedData = {
       	"issues": ["A-1", "A-2"]
    };

	done();

});

describe('issues-remaining', function() {

	describe('auth config', function() {

		it('should pass if globalAuth is present and authName refers to it', function (done) {

      		//This is the default case under the general config provided above

			issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
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
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
				done();
			});

    	});

		it('should fail if globalAuth is missing', function (done) {

      		delete mockedConfig.globalAuth;

			issuesRemaining(mockedConfig, mockedDependencies, function(err) {
				assert.ok(err == 'non credentials found in "issues-remaining" job. Please check config.globalAuth');
				done();
			});

    	});

		it('should fail if globalAuth is empty', function (done) {

      		mockedConfig.globalAuth = {};

			issuesRemaining(mockedConfig, mockedDependencies, function(err) {
				assert.ok(err == 'non credentials found in "issues-remaining" job. Please check config.globalAuth');
				done();
			});

		});

		it('should fail if globalAuth has no username', function (done) {

      		mockedConfig.globalAuth = {
		    	"confluence" : {
		        	"username" : null,
		        }
		    };

			issuesRemaining(mockedConfig, mockedDependencies, function(err) {
				assert.ok(err == 'non credentials found in "issues-remaining" job. Please check config.globalAuth');
				done();
			});

		});

		it('should fail if globalAuth has no password', function (done) {

      		mockedConfig.globalAuth = {
		    	"confluence" : {
		        	"password" : null,
		        }
		    };

			issuesRemaining(mockedConfig, mockedDependencies, function(err) {
				assert.ok(err == 'non credentials found in "issues-remaining" job. Please check config.globalAuth');
				done();
			});	

    	});

	});

	describe('general config', function() {

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
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
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
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
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
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
				done();
			});

    	}); 

		it('should pass if retryOnErrorTimes is missing', function (done) {

   			delete mockedConfig.retryOnErrorTimes;

			issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
				done();
			});

    	});

		it('should pass if interval is missing', function (done) {

   			delete mockedConfig.interval;

			issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count == mockedData.issues.length);
				done();
			});

    	});

		it('should pass if jqlOpen is missing', function (done) {

			//Default JIRA API behaviour, no jql passed means return all issues in the server

   			delete mockedConfig.jqlOpen;

			issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
				assert.ok(data.open.count);
				assert.ok(data.review.count == mockedData.issues.length);
				done();
			});

    	});

		it('should pass if jqlReview is missing', function (done) {

			//Default JIRA API behaviour, no jql passed means return all issues in the server

   			delete mockedConfig.jqlReview;

			issuesRemaining(mockedConfig, mockedDependencies, function(err, data) {
				assert.ok(data.open.count == mockedData.issues.length);
				assert.ok(data.review.count);
				done();
			});

    	});

	});

});