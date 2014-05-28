var assert = require('assert');
var stash = require('../providers/stash');
var test_util = require('./util/util');

var mockFetchRequest, mockedDependencies;
beforeEach(function (done) {

  mockFetchRequest = {
    auth: {
      username: "myusername",
      password: "secretpassword"
    },
    sourceId: 'confluence',
    repository: { project: "CONF", repository: "confluence" },
    options: {
      baseUrl: "https://stash.atlassian.com"
    },
    team: [
      { username: "iloire" },
      { username: "dwillis" },
      { username: "mreis" }
    ]
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


describe('stash provider', function () {

  describe('required parameters', function () {
    it('options are required in repository', function (done) {
      delete mockFetchRequest.options;
      stash(mockFetchRequest, mockedDependencies, function(err, data){
        assert.ok(err);
        assert.ok(err.indexOf('missing options') > -1);
        done();
      });
    });
  });

  describe('format', function () {

    it('returns data in the expected format', function (done) {
      mockedDependencies.easyRequest.JSON = function (options, cb) {
        var response = {
          size: 15,
          limit: 15,
          isLastPage: false,
          values: test_util.getFakeStashPR (10, 'iloire', ['dwillis']).
            concat(test_util.getFakeStashPR (5, 'dwillis', ['mreis'])).
            concat(test_util.getFakeStashPR (5, 'mreis', ['dwillis', 'iloire']))
        };
        cb(null, response);
      };

      stash(mockFetchRequest, mockedDependencies, function(err, users){
        assert.ifError(err);

        assert.equal(users.length, 3);

        assert.equal(users[0].user.username, 'iloire');
        assert.equal(users[0].PR, 5);

        assert.equal(users[1].user.username, 'dwillis');
        assert.equal(users[1].PR, 15);

        assert.equal(users[2].user.username, 'mreis');
        assert.equal(users[2].PR, 5);

        done();
      });
    });
  });

});
