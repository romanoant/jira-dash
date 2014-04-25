var assert = require('assert');
var Bamboo = require('../lib/bamboo.js');
var cheerio = require('cheerio');

describe('buildoverview', function () {

  var config;
  var noCacheMock = {
    put: function() {},
    get: function() {}
  };

  var requestFunctionSuccessful = function(response) {
    return function (options, callback) {
      callback(null, {statusCode: 200}, response);
    };
  };

  var newBambooWithRequest = function(request) {
    return new Bamboo('url', 'user', 'password', request, noCacheMock, cheerio);
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
  //  Test fetching responsability
  // ------------------------------------------
  describe('responsability', function () {
    it('should return the correct users for a certain html chunk', function (done) {
      var body = "<div id=page><div class=responsible-summary><ul>" +
          "<li><img src=\"\"><a href=\"\">username</a></li>" +
          "<li><img src=\"\"><a href=\"\">username 2</a></li>" +
          "</ul></div></div>";

      var bamboo = newBambooWithRequest(requestFunctionSuccessful(body));

      var buildKey = "test";
      bamboo.getResponsible(buildKey, function (err, users) {
        assert.ok(!err);
        assert.equal(users.length, 2);
        assert.equal(users[1].name, "username 2");
        done();
      });
    });


    it('should return error if there is an error during the http call', function (done) {
      var bamboo = newBambooWithRequest(function (options, callback) {
        callback("err", {statusCode: 500}, "{}");
      });

      var buildKey = "test";
      bamboo.getResponsible(buildKey, function (err, users) {
        assert.ok(err);
        assert.equal(users, null);
        done();
      });
    });

  });


  // ------------------------------------------
  //  Test converting projects to plans
  // ------------------------------------------
  describe('project_to_plans', function () {

    it('should be a valid build string', function (done) {
      var bamboo = newBambooWithRequest(requestFunctionSuccessful("{}"));

      var buildKey = "";
      bamboo.getPlansFromProject(buildKey, function (err, plans) {
        assert.ok(err);
        done();
      });
    });


    it('should return one plan if dash found in build (plan key)', function (done) {
      var bamboo = newBambooWithRequest(requestFunctionSuccessful("{}"));

      var buildKey = "test-test";
      bamboo.getPlansFromProject(buildKey, function (err, plans) {
        assert.ok(!err);
        assert.equal(plans.length, 1);
        done();
      });
    });

  });

  // ------------------------------------------
  //  Test fetching plan info
  // ------------------------------------------
  describe('get_plan_info', function () {

    it('should return plan info', function (done) {
      var bamboo = newBambooWithRequest(requestFunctionSuccessful("{\"planName\":\"Main Build\"}"));

      var plan = "TEST";
      bamboo.getPlanLatestBuildResult(plan, function (err, plan_info) {
        assert.ok(!err);
        assert.ok(plan_info.planName);
        done();
      });
    });


    it('should handle error if server return error', function (done) {
      var bamboo = newBambooWithRequest(function (options, callback) {
        callback("error", {statusCode: 500}, null);
      });

      var plan = "TEST";
      bamboo.getPlanLatestBuildResult(plan, function (err, plan_info) {
        assert.ok(err);
        assert.ok(!plan_info);
        done();
      });
    });


    it('should handle error if server return ok status code but json is invalid', function (done) {
      var bamboo = newBambooWithRequest(requestFunctionSuccessful("-invalid json-"));

      var plan = "TEST";
      bamboo.getPlanLatestBuildResult(plan, function (err, plan_info) {
        assert.ok(err);
        assert.ok(!plan_info);
        done();
      });
    });

  });

});