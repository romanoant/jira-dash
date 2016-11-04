/**
 * Test file for Job: pipelines-builds
 */

var assert = require ('assert');
var bitbucketReqFn = require('../helpers/bitbucketRequest');

describe('bitbucket-builds tests', function() {

  describe ('bitbucketRequest()', function() {
    it('should reject if empty user or pass credentials passed', function (done) {
      var configWithoutCreds = {
        config: {
          globalAuth: {
            bitbucket: { username: '', password: '' },
          },
          credentials: 'bitbucket',
        },
      };
      bitbucketReqFn(configWithoutCreds, function(err) {
        assert.equal(err, 'Bitbucket username and/or password not provided');
        done();
      })
    });

    it('should return JSON with body as json', function (done) {
      var responseJson = { ok: true };
      var optsWithRequestStub = {
        config: {
          globalAuth: {
            bitbucket: { username: 'stub', password: 'stub' },
          },
          credentials: 'bitbucket',
        },
        request: function(opts, callback) {
          callback(null, null, responseJson);
        },
      };
      bitbucketReqFn(optsWithRequestStub, function(err, resp, body) {
        assert.equal(err, null);
        assert.equal(typeof body, 'object');
        assert.deepEqual(body, responseJson);
        done();
      })
    });
  });

});
