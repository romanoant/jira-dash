var assert = require('assert');
var sinon = require('sinon');
var _ = require('underscore');
var bitbucket = require('../providers/bitbucket');

var mockFetchRequest, mockedDependencies, page1, JSON;

function prListUrlFor(org, repo) {
  return "https://bitbucket.org/api/2.0/repositories/" + org + "/" + repo + "/pullrequests?state=OPEN";
}

function extendJsonMock(stub) {
  return _.extend(stub, {
    returnsJson: function(url, json) {
      return extendJsonMock(this.withArgs(sinon.match.has('url', url)).callsArgWith(1, null, json));
    }
  })
}

beforeEach(function (done) {

  mockFetchRequest = {
    auth: {
      username: "myusername",
      password: "secretpassword"
    },

    sourceId: 'bitbucket',
    repository: {
      org: "atlassian", repository: "atlassian-events"
    },

    team: [
      { username: "iloire" },
      { username: "luuuis" }
    ]
  };

  mockedDependencies = {
    logger: console,
    easyRequest: {
      JSON: JSON = extendJsonMock(sinon.stub().callsArgWith(1, null, null))
    },
    async: require('async'),
    underscore: require('underscore')
  };

  page1 = prListUrlFor(mockFetchRequest.repository.org, mockFetchRequest.repository.repository);

  done();
});

describe('Bitbucket provider', function () {

  describe('fetch repository validation', function () {

    it('should return error when org name is missing', function (done) {
      delete mockFetchRequest.repository.org;
      bitbucket(mockFetchRequest, mockedDependencies, function (err) {
        assert.ok(err && err.indexOf('missing org') > -1);
        done();
      });
    });

    it('should return error when repository name is missing', function (done) {
      delete mockFetchRequest.repository.repository;
      bitbucket(mockFetchRequest, mockedDependencies, function (err) {
        assert.ok(err && err.indexOf('missing repository') > -1);
        done();
      });
    });
  });

  describe('calls to Bitbucket REST API', function () {
    it('should pass username and password in authentication headers', function (done) {
      bitbucket(mockFetchRequest, mockedDependencies, function () {
        assert.ok(mockedDependencies.easyRequest.JSON.called);
        assert.deepEqual(mockedDependencies.easyRequest.JSON.getCall(0).args[0].headers, {
          "authorization": "Basic bXl1c2VybmFtZTpzZWNyZXRwYXNzd29yZA=="
        });

        done();
      });
    });

    it('should ask for OPEN pull requests only', function (done) {
      bitbucket(mockFetchRequest, mockedDependencies, function () {
        assert.ok(mockedDependencies.easyRequest.JSON.called);
        assert.equal(mockedDependencies.easyRequest.JSON.getCall(0).args[0].url, page1);
        done();
      });
    });

    it('should encode org and repository path components', function (done) {
      mockFetchRequest.repository.org = "at lassian";
      mockFetchRequest.repository.repository = "re pository";
      bitbucket(mockFetchRequest, mockedDependencies, function () {
        assert.ok(mockedDependencies.easyRequest.JSON.called);
        assert.equal(mockedDependencies.easyRequest.JSON.getCall(0).args[0].url, prListUrlFor("at%20lassian", "re%20pository"));
        done();
      });
    });

    it('should handle response with no PRs', function (done) {
      mockedDependencies.easyRequest.JSON = sinon.stub().withArgs(sinon.match.has("url", "https://bitbucket.org/api/2.0/repositories/atlassian/atlassian-events/pullrequests?state=OPEN")).callsArgWith(1, null, {
        pagelen: 2,
        page: 1,
        size: 0,
        values: []
      });

      bitbucket(mockFetchRequest, mockedDependencies, function (err, users) {
        assert.ifError(err);
        assert.deepEqual(users, _.map(mockFetchRequest.team, function (user) {
          return {
            user: user,
            PR: 0
          }
        }));

        done();
      });
    });

    it('should handle responses with multiple pages of PRs', function (done) {
      JSON.returnsJson(page1, {
        pagelen: 1,
        next: 'page2-url',
        page: 1,
        size: 2,
        values: [
          { links: { self: { href: 'pr1-href' }} }
        ]
      }).returnsJson("page2-url", {
        pagelen: 2,
        previous: page1,
        page: 2,
        size: 2,
        values: [
          { links: { self: { href: 'pr2-href' }} }
        ]
      }).returnsJson("pr1-href", {
        author: user('luuuis'),
        participants: [ participant('iloire') ]
      }).returnsJson("pr2-href", {
        author: user('iloire'),
        participants: [ participant('luuuis') ]
      });

      bitbucket(mockFetchRequest, mockedDependencies, function (err, users) {
        assert.ifError(err);
        assert.deepEqual(users, [
          {"user": {"username": "iloire"}, "PR": 1},
          {"user": {"username": "luuuis"}, "PR": 1}
        ]);

        done();
      });
    });

    it('should not count PRs that a user has created', function (done) {
      JSON.returnsJson(page1, {
        pagelen: 10,
        page: 1,
        size: 2,
        values: [
          { links: { self: { href: 'pr1-href' }} },
          { links: { self: { href: 'pr2-href' }} }
        ]
      }).returnsJson("pr1-href", {
        author: user('luuuis'),
        participants: [ participant('iloire') ]
      }).returnsJson("pr2-href", {
        author: user('iloire'),
        participants: [ participant('luuuis'), participant('iloire') ]
      });

      bitbucket(mockFetchRequest, mockedDependencies, function (err, users) {
        assert.ifError(err);
        assert.deepEqual(users, [
          { "user": {"username": "iloire"}, "PR": 1 },
          { "user": {"username": "luuuis"}, "PR": 1 }
        ]);

        done();
      });
    });

    it('should not return users that are not part of the team', function (done) {
      JSON.returnsJson(page1, {
        pagelen: 10,
        page: 1,
        size: 1,
        values: [
          { links: { self: { href: 'pr1-href' }} }
        ]
      }).returnsJson("pr1-href", {
        author: user('luuuis'),
        participants: [ participant('iloire'), participant('some-random') ]
      });

      bitbucket(mockFetchRequest, mockedDependencies, function (err, users) {
        assert.ifError(err);
        assert.deepEqual(users, [
          { "user": {"username": "iloire"}, "PR": 1 },
          { "user": {"username": "luuuis"}, "PR": 0 }
        ]);

        done();
      });
    });
  });

  function user(username) {
    return { username: username };
  }

  function participant(username) {
    return { user: user(username) };
  }

});
