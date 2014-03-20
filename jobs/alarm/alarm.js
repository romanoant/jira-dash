/**
  
  Alarm clock

  Config example:

      "editor-alarm-pushups": {
        "interval": 0,
        "alarms":[
          { cron: "0 * * * * *", title: "test alarm", splashDuration: "4" }, // every minute, splash for 4 seconds
          { cron: "0 0 * * * *", title: "test alarm" }, // every hour
          { cron: "0 0 0 * * *", title: "test alarm" }, // every day at 00:00:00
          { cron: "0 0 0 1 * *", title: "test alarm" } // every 1st of every month
        "showDate": false
      },

*/

var CronJob = require("cron").CronJob;

module.exports = function (config, dependencies, job_callback) {
  if (!this.alarms) {
    this.alarms = createCronJobsForAlarms(config, dependencies, job_callback);
  }
  job_callback(null, { });
  return this.alarms;
};


function createCronJobsForAlarms (config, dependencies, job_callback) {
  var alarms = config.alarms;
  var moment = dependencies.moment;

  // sanity checks
  if (!alarms || !alarms.length)
    alarms = [];

  var cronJobs = [];

  for (var i = 0, l = alarms.length; i<l; i++) {
    var cronJob = new CronJob({
      cronTime: alarms[i].cron,
      onTick: makeCronHandler(alarms[i], config, dependencies, job_callback),
      timeZone: alarms[i].timeZone,
      start: true });

    cronJobs.push(cronJob);
  }
  return cronJobs;
}

/**
 * Creates a function that calls the job_callback with all the data the client needs for this activity.
 */
function makeCronHandler(alarm, config, dependencies, job_callback) {
  return function () {
    job_callback(null, { alarm: alarm });
  };
}
