var _ = require('underscore');
var assert = require('assert');
var sinon = require('sinon');
var pendingPR = require('../pending-PR');
var test_util = require('./util/util');

var mockedConfig, mockedDependencies, mockedData;

beforeEach(function (done) {

  mockedConfig = {

    globalAuth: {
      confluence: {
        username: "myusername",
        password: "secretpassword"
      }
    },

    interval: 20000,

    team: [
      { username: "iloire" },
      { username: "dwillis" },
      { username: "mreis", aliases: { otherServer: "other-miter" } },
      { username: "lmiranda", email: "lmiranda@example.com", display: "Luis", aliases: { confluence: "stash-lmiranda" } }
    ],

    servers: {
      confluence: {
        provider: "STASH",
        repositories: [
          { project: 'CONF', repository: 'confluence' }
        ],
        options: {
          baseUrl: "https://stash.atlassian.com"
        }
      }
    }
  };

  mockedDependencies = {
    logger: console,
    easyRequest : {
      JSON : function (options, cb) {
        cb(null, {});
      }
    },
    async : require('async'),
    underscore : require('underscore')
  };

  done();
});

describe('pending PR', function () {

  describe('configuration', function () {

    it('returns passes the title to the widget', function (done) {
      mockedDependencies.easyRequest.JSON = function (options, cb) {
        cb(null, { values : []} ); // fake response to get the callback
      };

      mockedConfig.title = 'viva llo y mi cavallo';
      pendingPR(mockedConfig, mockedDependencies, function(err, data){
        assert.ifError(err);
        assert.equal(data.title, 'viva llo y mi cavallo');
        done();
      });
    });

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

      it('requires servers', function(done) {
        mockedConfig.servers = null;
        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          done();
        });
      });

      describe('each source', function() {

        it('requires a provider', function(done) {
          delete mockedConfig.servers.confluence.provider;
          pendingPR(mockedConfig, mockedDependencies, function(err){
            assert.ok(err.indexOf('missing provider') > -1);
            done();
          });
        });

        it('requires repositories', function(done) {
          delete mockedConfig.servers.confluence.repositories;
          pendingPR(mockedConfig, mockedDependencies, function(err){
            assert.ok(err.indexOf('missing repositories') > -1);
            done();
          });
        });
      });

    });
  });

  describe('fetch request', function(){
    it('user aliases are mapped before invoking the strategy', function(done) {
      // mock stash provider
      var stash = sinon.stub().callsArg(2);
      pendingPR(mockedConfig, mockedDependencies, function() {
        assert.ok(stash.calledOnce, "STASH strategy should be called once, not " + stash.callCount + " times");

        var fetch = stash.getCall(0).args[0];
        assert.equal(fetch.sourceId, 'confluence');
        assert.deepEqual(fetch.repository, mockedConfig.servers.confluence.repositories[0]);
        assert.equal(fetch.team.length, mockedConfig.team.length);
        assert.deepEqual(_.pluck(fetch.team, 'username'), [
          "iloire",
          "dwillis",
          "mreis",
          "stash-lmiranda" // <- the only override for server='confluence'
        ]);

        done();
      }, {
        strategies: { STASH: stash } // pass in the mock stash provider
      });
    });

    it('user aliases are unmapped after invoking the strategy', function(done) {
      // mock stash provider
      var stash = function(fetch, dependencies, callback) {
        var isConfluenceRepo = _.isEqual([fetch.sourceId, fetch.repository], ['confluence', mockedConfig.servers.confluence.repositories[0]]);
        if (isConfluenceRepo) {
          callback(null, _.map([ "iloire", "dwillis", "mreis", "stash-lmiranda" ], function (username) {
            // fake up some PR counts for each user
            return {
              user: { username: username },
              PR: _.size(username)
            };
          }));
        } else {
          callback('unexpected args: ' + JSON.stringify({
            fetch: fetch,
            dependencies: dependencies,
            callback: callback
          }));
        }
      };

      pendingPR(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        assert.deepEqual(_.map(data.users, function(it) { return [ it.user.username, it.user.display, it.user.email, it.PR ] }), [
          ["iloire", undefined, undefined, 6],
          ["dwillis", undefined, undefined, 7],
          ["mreis", undefined, undefined, 5],
          ["lmiranda", "Luis", "lmiranda@example.com", 14] // <- mapped back to the real user
        ]);

        done();
      }, {
        strategies: { STASH: stash } // pass in the mock stash provider
      });
    });
  });

  describe('STASH strategy', function () {

    describe('required parameters', function () {

      it('requires repositories with at least one item', function (done) {
        mockedConfig.servers.confluence.repositories = [];
        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          done();
        });
      });

      it('requires repositories project field', function (done) {
        delete mockedConfig.servers.confluence.repositories[0].project;

        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          assert.ok(err.indexOf('missing project') > -1);
          done();
        });
      });

      it('requires repositories repository field', function (done) {
        delete mockedConfig.servers.confluence.repositories[0].repository;

        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          assert.ok(err.indexOf('missing repository') > -1);
          done();
        });
      });

      it('requires baseUrl field', function (done) {
        delete mockedConfig.servers.confluence.options.baseUrl;

        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          assert.ok(err.indexOf('missing baseUrl') > -1);
          done();
        });
      });

      it('warns about configuration changes', function(done) {
        mockedConfig.repositories = [];

        pendingPR(mockedConfig, mockedDependencies, function(err){
          assert.ok(err);
          assert.ok(err.indexOf('new configuration format') > -1);
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

        mockedConfig.servers.confluence.repositories = [
          { project: 'CONF', repository: 'confluence' },
          { project: 'JIRA', repository: 'jira' }
        ];

        pendingPR(mockedConfig, mockedDependencies, function(err, data){
          assert.ifError(err);

          assert.equal(data.users.length, mockedConfig.team.length);

          assert.equal(data.users[0].user.username, 'iloire');
          assert.equal(data.users[0].PR, 5);

          assert.equal(data.users[1].user.username, 'dwillis');
          assert.equal(data.users[1].PR, 0);

          assert.equal(data.users[2].user.username, 'mreis');
          assert.equal(data.users[2].PR, 22);

          assert.equal(data.users[3].user.username, 'lmiranda');
          assert.equal(data.users[3].PR, 0);

          done();
        });
      });

    });
  });
});
