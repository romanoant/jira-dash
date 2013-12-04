var assert = require('assert');
var cheerio = require('cheerio');
var buildoverview = require ('../buildoverview');

describe('buildoverview', function () {

  var config;
  var noCacheMock = {
    put: function() {},
    get: function() {}
  };

  beforeEach(function (done) {
    config = {
      interval: 20000,
      failBuilds: ["CONFUI-QUNITFFESR", "CONFUI-QUNITFFLATEST", "CONFUI-QUNITCHROMEPLUGINS" , "CONFUI-QUNITCHROMELATEST", "CONFUI-QUNITQCFFLATEST", "CONFUI-QUNITQEFFLATEST11"],
      showBuilds: [],
      widgetTitle: "QUNIT BUILDS"
    };

    config.globalAuth = {
      cbac: {
        username: "myusername",
        password: "secretpassword"
      }
    };
    done();
  });

  // ------------------------------------------
  //  build_overview main
  // ------------------------------------------
  describe('build_overview', function () {
    var config;

    beforeEach(function (done) {
      config = {
        interval: 20000,
        failBuilds: ["CONFUI-QUNITFFESR", "CONFUI-QUNITFFLATEST", "CONFUI-QUNITCHROMEPLUGINS" , "CONFUI-QUNITCHROMELATEST", "CONFUI-QUNITQCFFLATEST", "CONFUI-QUNITQEFFLATEST11"],
        showBuilds: ["COD-MSATP", "COD"],
        widgetTitle: "QUNIT BUILDS",
        bamboo_server: 'fake-one'

      };

      config.globalAuth = {
        cbac: {
          username: "myusername",
          password: "secretpassword"
        }
      };
      done();
    });


    it('should return array of data', function (done) {
      var dependencies = {
        request: function (options, callback) {
          if (options.url.match(/fake-one\/rest\/api\/latest\/result\/[^-]+-[^-]+-latest.json/)) {
            // latest build
            callback(null, {statusCode: 200}, '{ "key": "P-B-1", "plan" : { "enabled": "true" } }');
          }
          else if (options.url.match(/fake-one\/rest\/api\/latest\/result\/[^-]+-[^-]+-\d+.json/)) {
            // looking for build in progress
            callback(null, {statusCode: 404});
          }
          else if (options.url.match(/fake-one\/browse\/[^-]+-[^-]+-\d+/)) {
            // responsible
            callback(null, {statusCode: 200}, '');
          }
          else if (options.url.match(/fake-one\/rest\/api\/latest\/result\/[^-]+.json/)) {
            // get project
            callback(null, {statusCode: 200}, '{ "results": { "result" : [] } }');
          }
          else {
            console.log('request: ', options);
            throw 'what?';
          }
        },
        logger: {
          error: function(e) {
            assert.fail('Got unexpected error: ' + e);
          }
        }
      };

      var job_callback = function (error, data) {
        assert.equal(error, null);
        assert.ok(!data.error);
        assert.ok(data.showBuilds.length);
        assert.ok(data.failBuilds.length);

        assert.ok(!data.failBuilds[0].length);
        done();
      };

      buildoverview(config, dependencies, job_callback);
    });
  });

});