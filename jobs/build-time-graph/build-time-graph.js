/*

 Build time graph job.

   "build-time-graph-UI" : {
   "bamboo_server" : "https://collaboration-bamboo.internal.atlassian.com",
   "retryOnErrorTimes" : 3,
   "interval" : 120000,
   "widgetTitle" : "MASTER CI BUILD TIME",
   "graphWidth" : 1200,
   "graphHeight" : 960
 }

 */

var Bamboo = require('./lib/bamboo.js'),
    cache = require('memory-cache'),
    cheerio = require('cheerio');

module.exports = function(config, dependencies, job_callback) {
    // fallback to for configuration compatibility
    var authName = config.authName || 'cbac';

    if (!config.globalAuth || !config.globalAuth[authName] ||
        !config.globalAuth[authName].username || !config.globalAuth[authName].password){
        return job_callback('No Bamboo credentials found in buildoverview job for authName \'' + authName + '\'. Please check global authentication file');
    }

    if (!config.bamboo_server){
        return job_callback("No bamboo server configured");
    }

    var logger = dependencies.logger;

    var username = config.globalAuth[authName].username;
    var password = config.globalAuth[authName].password;
    var bamboo = new Bamboo(config.bamboo_server, username, password, dependencies.request, cache, cheerio);

    bamboo.getBuildTimeChartUrl(planKey, config.graphWidth, config.graphHeight, function(err, graphUrl, width, height) {
        if (err || !graphUrl){
            job_callback(err)
        }

        job_callback(null, graphUrl, width, height)
    })
}