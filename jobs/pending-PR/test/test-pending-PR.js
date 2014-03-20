var assert = require('assert');
var pendingPR = require('../pending-PR');
var test_util = require('./util/util');

var mockedConfig, mockedDependencies, mockedData;

beforeEach(function (done) {

  mockedConfig = {

    globalAuth: {
      'stash': {
        username: "myusername",
        password: "secretpassword"
      }
    },

    interval: 20000,

    team: [
     { username: "iloire" },
     { username: "dwillis" },
     { username: "mreis" }
    ],

    repositories: [
      {
        name: "confluence", 
        provider: "STASH", 

        options: {
          stashBaseUrl: "https://stash.atlassian.com",
          project: "CONF", 
          repository: "confluence"
        }
      }
    ],
  };

  mockedDependencies = {
    logger: console,
    easyRequest : {
      JSON : function (options, cb) {
        cb(null, {});
      }
    },
    async : require('async'),
    _ : require('underscore')
  };

  done();
});

describe('pending PR', function () {

  describe('required parameters', function () {
    it('returns error if credential object is not found', function (done) {
      mockedConfig.globalAuth = {};
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

    it('requires team', function (done) {
      mockedConfig.team = null;
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

    it('requires team with at least one component', function (done) {
      mockedConfig.team = [];
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

    it('requires repositories', function (done) {
      mockedConfig.repositories = null;
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

    it('requires repositories with at least one item', function (done) {
      mockedConfig.repositories = [];
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

    it('requires repositories project field', function (done) {
      delete mockedConfig.repositories[0].options.project;

      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        assert.ok(err.indexOf('missing project') > -1);
        done();
      });
    });

    it('requires repositories repository field', function (done) {
      delete mockedConfig.repositories[0].options.repository;

      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        assert.ok(err.indexOf('missing repository') > -1);
        done();
      });
    });

    it('requires repositories provider field', function (done) {
      delete mockedConfig.repositories[0].provider;

      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        assert.ok(err.indexOf('missing provider') > -1);
        done();
      });
    });

  });

  describe('STASH strategy', function () { 

    describe('required parameters', function () { 
      it('requires stashBaseUrl field', function (done) {
        delete mockedConfig.repositories[0].options.stashBaseUrl;

        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          assert.ok(err.indexOf('missing stashBaseUrl') > -1);
          done();
        });
      });
    });

    describe('fetch data', function () { 

      it('returns data from multiple users and mutiple repositories', function (done) {
        mockedDependencies.easyRequest.JSON = function (options, cb) {
          var response;
          if (options.url.indexOf('repos/confluence') > -1) {
            response = {
              size: 15,
              limit: 15,
              isLastPage: false,
              values: test_util.getFakeStashPR (10, 'iloire', ['mreis']).concat(test_util.getFakeStashPR (5, 'dwillis', ['iloire', 'mreis']))
            };
          }
          else {
            response = {
              size: 29,
              limit: 30,
              isLastPage: false,
              values: test_util.getFakeStashPR (22, 'iloire').concat(test_util.getFakeStashPR (7, 'dwillis', ['mreis']))
            };
          }
          cb(null, response);
        };

        mockedConfig.repositories = [
          {
            provider : "STASH", 
            options: {
              project: 'CONF', repository: 'confluence', stashBaseUrl: 'http://stash.atlassian.com'
            }
          },
          {
            provider : "STASH", 
            options: {
              project: 'JIRA', repository: 'jira', stashBaseUrl: 'http://stash.atlassian.com'
            }
          },
        ];

        pendingPR(mockedConfig, mockedDependencies, function(err, data){
          assert.ifError(err);

          assert.equal(data.users.length, 3);

          assert.equal(data.users[0].user.username, 'iloire');
          assert.equal(data.users[0].PR, 5);
          
          assert.equal(data.users[1].user.username, 'dwillis');
          assert.equal(data.users[1].PR, 0);

          assert.equal(data.users[2].user.username, 'mreis');
          assert.equal(data.users[2].PR, 22);

          done();
        });
      });

    });
  });
});
