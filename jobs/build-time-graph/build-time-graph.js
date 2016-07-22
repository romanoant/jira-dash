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
  cheerio = require('cheerio'),
  mkdirp = require('mkdirp'),
  fs = require('fs');

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

    var request = dependencies.request;

    var bamboo = new Bamboo(config.bamboo_server, username, password, request, cache, cheerio);
    bamboo.getBuildTimeChartUrl(config.planKey, config.graphWidth, config.graphHeight, config.dateRange, function(err, graphUrl, width, height) {
        if (err) {
            return job_callback(err);
        }

        var graphFileDirectory = 'assets/tmp';
        mkdirp(graphFileDirectory, function(err) {
            if(err) {
                return job_callback(err);
            }

            logger.debug('Downloading build time graph image at ' + graphUrl + ' to ' + graphFileDirectory);

            var graphFilename = 'build_time_graph.png';
            download(request, graphUrl, graphFileDirectory + '/' + graphFilename, function(err) {
                if(err) {
                    return job_callback(err);
                }

                logger.debug('Build time graph image downloaded');

                return job_callback(null, {
                    graphUrl: 'tmp/' + graphFilename,
                    width: width,
                    height: height,
                    title: config.widgetTitle
                });
            });

        });
    })
}

var download = function(request, uri, filename, callback) {
    request(uri)
      .on('error', function(err) {
          callback(err)
      })
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
};