/**
 * Test file for Job: elasticsearch time series
 */

var assert = require('chai').assert;
var elasticsearchTimeSeriesSUT = require('../elasticsearch-timeseries');
var async = require('async');
var underscore = require('underscore');
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
      series: [
        {
          "name": "Reactivations",
          "color": "green",
          "renderer": "line",
          "index": "logs_prod*",
          "query": {
            "match_phrase": {
              "path": "/activation"
            }
          }
        }
      ],
      "groupBy": "1d"
    };

    mockedDependencies = {
      async: async,
      underscore: underscore
    };
  });

  describe('config validation', function () {
    it('should require a valid "host" config value', function (done) {
      delete mockedConfig.host;
      elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing config');
        done();
      });
    });

    it('should require a valid "series" config value', function (done) {
      delete mockedConfig.series;
      elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing config');
        done();
      });
    });

    describe('a serie', function () {
      it('should require a valid "index"', function (done) {
        delete mockedConfig.series[0].index;
        elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
          assert.include(err, 'invalid config parameters for serie');
          done();
        });
      });

      it('should require a valid "query"', function (done) {
        delete mockedConfig.series[0].query;
        elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
          assert.include(err, 'invalid config parameters for serie');
          done();
        });
      });
    });

    it('should require a valid "authName" config value', function (done) {
      delete mockedConfig.authName;
      elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing auth config');
        done();
      });
    });

    it('should require username', function (done) {
      delete mockedConfig.globalAuth.myconfigKey.username;
      elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing auth config');
        done();
      });
    });

    it('should require password', function (done) {
      delete mockedConfig.globalAuth.myconfigKey.password;
      elasticsearchTimeSeriesSUT.onRun(mockedConfig, mockedDependencies, function (err) {
        assert.include(err, 'missing auth config');
        done();
      });
    });
  });

});
