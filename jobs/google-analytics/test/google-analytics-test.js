var assert = require('assert');
var googleAnalytics = require('../google-analytics');

describe('google analytics', function(){
  var defaultConfig;

  beforeEach(function(done){
    defaultConfig = {
      "interval": 60000,
      "title": "Last 30'",
      "viewID": "1009XXXXX",
      "authEmail": "335287341572-bbcqXXXXXXXXXXXXXXXX@developer.gserviceaccount.com",
      "metrics": ["rt:goal16Completions"],
      "dimensions": ["rt:minutesAgo", "rt:browser", "rt:browserVersion"],
      "captions": ["min. ago", "browser", "version", "Conversions"],
      "realTime": true,
      "gaKeyLocation": 'mykey.p12'
    };
    done();
  });

  describe('configuration', function(){

    it ('should require a viewID', function(done){
      delete defaultConfig.viewID;
      googleAnalytics(defaultConfig, {}, function(err){
        assert.ok(err.indexOf('viewID not found') > -1);
        done();
      });
    });

    it ('should require a authEmail', function(done){
      delete defaultConfig.authEmail;
      googleAnalytics(defaultConfig, {}, function(err){
        assert.ok(err.indexOf('authEmail not found') > -1);
        done();
      });
    });

    it ('should require metrics', function(done){
      delete defaultConfig.metrics;
      googleAnalytics(defaultConfig, {}, function(err){
        assert.ok(err.indexOf('no metrics provided') > -1);
        done();
      });
    });

    it ('should require dimensions', function(done){
      delete defaultConfig.dimensions;
      googleAnalytics(defaultConfig, {}, function(err){
        assert.ok(err.indexOf('no dimensions provided') > -1);
        done();
      });
    });

    it ('should not allow directory traversal on key location', function(done){
      defaultConfig.gaKeyLocation = '../../../../../../etc/password';
      googleAnalytics(defaultConfig, {}, function(err){
        assert.ok(err.indexOf('path traversal detected') > -1);
        done();
      });
    });
  });
});