var assert = require('assert');
var pendingPR = require('../pending-PR');

var mockedConfig, mockedDependencies, mockedData;

function getFakePR (number, author) {
  var listPRs=[];

  for (var i = 0; i < number; i++) {
    listPRs.push({
      id : i,
      title: 'title' + i,
      description: 'description' + i,
      state: 'OPEN',
      author: {
        user : {
          name: author
        }
      }
    });
  }
  return listPRs;
}

beforeEach(function (done) {

  mockedConfig = {
    stashBaseUrl: 'http://stash.atlassian.com',
    globalAuth: {
      'stash': {
        username: "myusername",
        password: "secretpassword"
      }
    },
    interval: 20000,
    team: ["iloire", "dwillis"],
    repositories: [
      { project: "CONF", repository: "confluence" }
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

    it('requires stash base url', function (done) {
      mockedConfig.stashBaseUrl = null;
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
      mockedConfig.repositories = [
        { project: null, repository: 'confluence'}
      ];
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

    it('requires repositories repository field', function (done) {
      mockedConfig.repositories = [
        { project: 'CONF', repository: null}
      ];
      pendingPR(mockedConfig, mockedDependencies, function(err){
        assert.ok(err);
        done();
      });
    });

  });

  describe('fetch data', function () { 
    it('returns data from one user and one repositories', function (done) {

      mockedDependencies.easyRequest.JSON = function (options, cb) {
        var response = {
          size: 10,
          limit: 10,
          isLastPage: false, 
          values: getFakePR (10, 'iloire')
        };
        cb(null, response);
      };

      mockedConfig.repositories = [
        { project: 'CONF', repository: 'confluence'}
      ];

      pendingPR(mockedConfig, mockedDependencies, function(err, data){
        assert.ifError(err);
        assert.equal(data.users.length, 2);
        assert.equal(data.users[0].PR.length, 10);
        assert.equal(data.users[1].PR.length, 0);
        done();
      });
    });


    it('returns data from multiple users and one repositories', function (done) {
      mockedDependencies.easyRequest.JSON = function (options, cb) {
        var response = {
          size: 15,
          limit: 15,
          isLastPage: false, 
          values: getFakePR (10, 'iloire').concat(getFakePR (5, 'dwillis'))
        };
        cb(null, response);
      };

      mockedConfig.repositories = [
        { project: 'CONF', repository: 'confluence'}
      ];

      pendingPR(mockedConfig, mockedDependencies, function(err, data){
        assert.ifError(err);
        assert.equal(data.users.length, 2);
        assert.equal(data.users[0].PR.length, 10);
        assert.equal(data.users[1].PR.length, 5);
        done();
      });
    });

    it('returns data from multiple users and mutiple repositories', function (done) {
      mockedDependencies.easyRequest.JSON = function (options, cb) {
        var response;
        if (options.url.indexOf('repos/confluence') > -1) {
          response = {
            size: 15,
            limit: 15,
            isLastPage: false,
            values: getFakePR (10, 'iloire').concat(getFakePR (5, 'dwillis'))
          };
        }
        else {
          response = {
            size: 29,
            limit: 30,
            isLastPage: false,
            values: getFakePR (22, 'iloire').concat(getFakePR (7, 'dwillis'))
          };
        }
        cb(null, response);
      };

      mockedConfig.repositories = [
        { project: 'CONF', repository: 'confluence'},
        { project: 'JIRA', repository: 'jira'}
      ];

      pendingPR(mockedConfig, mockedDependencies, function(err, data){
        assert.ifError(err);
        assert.equal(data.users.length, 2);
        assert.equal(data.users[0].PR.length, 32);
        assert.equal(data.users[1].PR.length, 12);
        done();
      });
    });

  });

});
