/**
 * Test file for Job: elasticsearch
 */

var assert = require('chai').assert;
var elasticsearchSUT = require('../elasticsearch');

var mockedConfig, mockedDependencies;

describe('elasticsearch test', function () {

  beforeEach(function () {
    mockedConfig = {
      globalAuth: {
        myconfigKey: {
          username: "myusername",
          password: "secretpassword"
        }
      },
      authName: 'myconfigKey',
      interval: 20000,
      host: 'myhost:9000',
      port: 9200,
      searchQuery: {
        index: 'myindex',
        query: {
          "match_phrase": {
            "path": "/passivation"
          }
        }
      }
    };

    mockedDependencies = {
      logger: console
    };
  });

  describe('config checks', function () {
    it('should require a valid "host" config value', function (done) {
      delete mockedConfig.host;
      elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing config');
        done();
      });
    });

    it('should require a valid "query" config value', function (done) {
      delete mockedConfig.searchQuery;
      elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing config');
        done();
      });
    });

    describe('searchQuery', function(){
      it('should require a valid "index"', function (done) {
        delete mockedConfig.searchQuery.index;
        elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
          assert.include(err, 'missing config');
          done();
        });
      });

      it('should require a valid "query"', function (done) {
        delete mockedConfig.searchQuery.query;
        elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
          assert.include(err, 'missing config');
          done();
        });
      });
    });

    it('should require a valid "authName" config value', function (done) {
      delete mockedConfig.authName;
      elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing auth config');
        done();
      });
    });

    it('should require username', function (done) {
      delete mockedConfig.globalAuth.myconfigKey.username;
      elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.ok(err);
        done();
      });
    });

    it('should require password', function (done) {
      delete mockedConfig.globalAuth.myconfigKey.password;
      elasticsearchSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.ok(err);
        done();
      });
    });
  });

});
