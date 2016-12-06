var assert = require('assert');
var ClockJob = require('../clock');

describe('Clock job', function () {
    describe('data object', function () {
            var config = {
                        "interval": 0,
                        "stfuOnly": false,
                        "stfuHours":[
                            {"start":945, "end": 1215},
                            {"start":1415, "end": 1615}
                        ]
                    };
        it('should have proper data when stfu is passed', function(){
            var clock = new ClockJob(config, {}, function (error, data) {
                assert.equal(data.stfuEnabled, true, "stfuEnabled should be true");
                assert.equal(data.stfuOnly,false,  "stfuOnly should be false");
                assert.deepEqual(data.stfuHours, [{"start":945, "end": 1215},{"start":1415, "end": 1615}], "stfuHours should exist");
            });
        })

        it('should have proper data when stfu is not passed', function(){
            var config = {
                            "interval": 0,
                            "stfuOnly": false
                        };
            var clock = new ClockJob(config, {}, function (error, data) {
                assert.strictEqual(data.stfuEnabled, false, "stfuEnabled should be false");
            });
        })

    });
});