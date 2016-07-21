/*

 Build time graph job.

 "build-time-graph-UI" : {
   "bamboo_server" : "https://collaboration-bamboo.internal.atlassian.com",
   "authName" : "bamboo",
   "retryOnErrorTimes" : 3,
   "interval" : 120000,
   "widgetTitle" : "MASTER CI BUILD TIME",
   "planKey" : "SDHMASTER-SDHMASTERPRMY",
   "graphWidth" : 1200,
   "graphHeight" : 960,
   "dateRange" : "LAST_30_DAYS" // One of LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, ALL
 }

 */

var Bamboo = require('../buildoverview/lib/bamboo.js'),
    cache = require('memory-cache'),
    cheerio = require('cheerio');

module.exports = function(config, dependencies, job_callback) {
    // fallback to for configuration compatibility
    var authName = config.authName || 'cbac';

    if (!config.globalAuth || !config.globalAuth[authName] ||
        !config.globalAuth[authName].username || !config.globalAuth[authName].password){
        return job_callback('Authentication problems found in "build-time-graph" job. Please check config.globalAuth and authName attribute in widget configuration');
    }

    if (!config.bamboo_server){
        return job_callback("bamboo_server config key not found");
    }

    var logger = dependencies.logger;

    var username = config.globalAuth[authName].username;
    var password = config.globalAuth[authName].password;
    var bamboo = new Bamboo(config.bamboo_server, username, password, dependencies.request, cache, cheerio);

    bamboo.getBuildTimeChartUrl(config.planKey, config.graphWidth, config.graphHeight, config.dateRange, function(err, graphUrl, width, height) {
        if (err) {
            return job_callback(err)
        }

        return job_callback(null, {
            graphUrl: graphUrl,
            width: width,
            height: height,
            title: config.widgetTitle
        });
    })
}