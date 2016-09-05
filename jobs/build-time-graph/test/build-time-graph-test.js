var mock = require('mock-require');
var assert = require('assert');
var buildTimeGraph = require('../build-time-graph');

var graphFilename = 'jfreechart-onetime-425021406045105756.png';
var requestedWidth = 450;
var requestedHeight = 360;

// mocks
var mockedConfig, mockedDependencies;

beforeEach(function(done){
  mock('../../buildoverview/lib/bamboo.js', function() {
    return {
      getBuildTimeChartUrl: function(planKey, width, height, dateRange, callback) {
        console.log('Bamboo getBuildTimeChartUrl called');
        callback(null, "", width, height)
      }
    }
  });


  mockedConfig = {

    //widget config
    "bamboo_server" : "https://servicedesk-bamboo.internal.atlassian.com",
    "authName" : "bamboo",
    "retryOnErrorTimes" : 3,
    "interval" : 10000,
    "widgetTitle" : "MASTER CI BUILD TIME",
    "planKey" : "SDHMASTER-SDHMASTERPRMY",
    "graphWidth" : requestedWidth,
    "graphHeight" : requestedHeight,
    "dateRange" : "LAST_7_DAYS",

    //globalAuth config
    globalAuth: {
      "bamboo" : {
        "username" : "sdbac_username",
        "password" : "sdbac_password"
      }
    }

  };

  mockedRequest = {
    pipe: function() {
      return mockedRequest;
    },
    on: function() {
      return mockedRequest;
    }
  }

  mockedDependencies = {

    request: function (options, callback) {

      if(callback) {
        var returnedJson =
          '{' +
          '"location": "' +  graphFilename + '",' +
          '"imageMapName": "MWA0s_map",' +
          '"imageMap": "<map></map>",' +
          '"width": ' + requestedWidth + ',' +
          '"height": ' + requestedHeight +
          '}';

        callback(null, {statusCode: 200}, returnedJson);
      };

      return mockedRequest;

    },

    logger: {
      log : function(input) {},
      debug : function(input) {},
      error : function(input) {}
    },

    mkdirp: function (dir, callback) {
      callback(null);
    }

  };

  mockedDependencies.request.jar = function() {
    return {}
  };

  done();

});

afterEach(function(done){
  mock.stop('../../buildoverview/lib/bamboo.js');
  done();
});

describe('build-time-graph', function() {

  describe('happy path', function() {

    it('should return the correct graph width', function (done) {

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.equal(data.width, requestedWidth)
        done();
      });

    });

    it('should return the correct graph height', function (done) {

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.equal(data.height, requestedHeight)
        done();
      });

    });

  }),

  describe('auth config', function () {

    it('should fail if globalAuth is missing', function (done) {

      delete mockedConfig.globalAuth;

      buildTimeGraph(mockedConfig, mockedDependencies, function (err) {
        assert.ok(err == 'Authentication problems found in "build-time-graph" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

    it('should fail if globalAuth is empty', function (done) {

      mockedConfig.globalAuth = {};

      buildTimeGraph(mockedConfig, mockedDependencies, function (err) {
        assert.ok(err == 'Authentication problems found in "build-time-graph" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

    it('should fail if globalAuth has no username', function (done) {

      delete mockedConfig.globalAuth.bamboo.username

      buildTimeGraph(mockedConfig, mockedDependencies, function (err) {
        assert.ok(err == 'Authentication problems found in "build-time-graph" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

    it('should fail if globalAuth has no password', function (done) {

      delete mockedConfig.globalAuth.bamboo.password

      buildTimeGraph(mockedConfig, mockedDependencies, function (err) {
        assert.ok(err == 'Authentication problems found in "build-time-graph" job. Please check config.globalAuth and authName attribute in widget configuration');
        done();
      });

    });

  });

  describe('mandatory / optional config', function() {

    it('should fail if bamboo_server is missing', function (done) {

      delete mockedConfig.bamboo_server;

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err == 'bamboo_server config key not found');
        done();
      });

    });


    it('should use the custom title provided in the config', function (done) {

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.equal(data.title, mockedConfig.widgetTitle)
        done();
      });

    });

    it('should pass if the custom title is not provided in the config', function (done) {

      delete mockedConfig.widgetTitle;

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });
  });

  describe('wrong config', function() {

    it('should fail if bamboo_server is present but empty', function (done) {

      mockedConfig.bamboo_server = "";

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.ok(err);
        done();
      });

    });

    it('should fail if retryOnErrorTimes has the wrong type', function (done) {

      mockedConfig.retryOnErrorTimes = "string";

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should fail if interval has the wrong type', function (done) {

      mockedConfig.interval = "string";

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

    it('should fail if the custom title provided in the config has the wrong type', function (done) {

      mockedConfig.widgetTitle = 1;

      buildTimeGraph(mockedConfig, mockedDependencies, function(err, data) {
        assert.ifError(err);
        done();
      });

    });

  });

});
