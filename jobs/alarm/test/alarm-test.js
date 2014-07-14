var assert = require('assert'),
    alarm = require('../alarm'),
    sinon = require('sinon'),
    
    //this injected by atlasboard in runtime. we need to add it as a package dependency in order to run the tests
    moment = require('moment'); 

describe('alarm test', function () {

  var config, dependencies, sinonClock, alarms;

  beforeEach(function(done){
    dependencies = {
      moment: moment
    };
    sinonClock = sinon.useFakeTimers(+new Date()); // 946713600000 = 1/1/2000 8:00:00
    global.alarms = undefined; // when unit testing, "this" for alarms is the global object
    done();
  });

  afterEach(function(done){
    sinonClock.restore();
    done();
    for (var i = 0; i < alarms.length; i++) {
      alarms[i].stop();
    }
  });


  describe('configuration', function(){

    it('should not require config.alarms', function (done) {
      config = { };
      alarms = alarm(config, dependencies, function(err, data){
        assert.ifError(err);
        done();
      });
    });

    it('should not throw if config.alarms is not an array', function (done) {
      config = { alarms : {} };
      alarms = alarm(config, dependencies, function(err, data){
        assert.ifError(err);
        done();
      });
    });
  });

  describe('current alarm', function(){
    it('should display the current alarm if there is one currently active', function (done) {
      var date = new Date();

      config = { alarms :
        [
          { cron: "* * * * * *", title: "test alarm" }
        ]
      };

      var firstCall = true;
      var mock = {
        callback: function(err, data){
          assert.ifError(err);
          if (!firstCall)
            assert.ok(data.alarm); // the second call contains the actuall alarm data

          if (firstCall)
            firstCall = false;
        }
      };

      var spy = sinon.spy(mock, "callback");

      alarms = alarm(config, dependencies, mock.callback);
      sinonClock.tick(1000); // tick one sec

      assert.ok(spy.calledTwice);
      mock.callback.restore();
      done();
    });

    it('should display no current alarm if there is not any active', function (done) {
      var date = new Date();

      config = { alarms :
        [
          { cron: "30 * * * * *", title: "test alarm" }
        ]
      };

      var mock = {
        callback: function(err, data){
          assert.ifError(err);
          assert.ok(data.alarm === undefined);
        }
      };

      var spy = sinon.spy(mock, "callback");

      alarms = alarm(config, dependencies, mock.callback);
      sinonClock.tick(10000); // tick 10 sec

      assert.equal(1, spy.callCount, "expected only the initial callback call but got " + spy.callCount);
      done();
    });

  });

});