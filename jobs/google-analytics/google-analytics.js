/**
 * Job: google-analytics
 * https://developers.google.com/analytics/devguides/reporting/core/dimsmets
 * Expected configuration:
 *
 * { 
 *   myconfigKey : [ 
 *     {
 *      authEmail : 'email@localhost',
 *      viewID: '232323', // without the 'ga:' prefix
 *      startDate: '12/12/12',
 *      endDate: '12/12/12',
 *      metrics: ["ga:sessions","ga:pageviews"], // or ["rt:activeUsers"] if using the realtime API
 *      dimensions: ["ga:deviceCategory"],
 *      realTime: true
 *     }
 *   ]
 * }
 */
var google = require('googleapis');
var analytics = google.analytics('v3');
var path = require('path');

module.exports = function(config, dependencies, job_callback) {

    function safeConfig(config) { // this will be eventually done by Atlasboard?
        var c = {};
        for (var key in config) {
            if (key !== "globalAuth") {
                c[key] = config[key];
            }
        }
        return c;
    }

    if (!config.authEmail) {
        return job_callback('authEmail not found in configuration');
    }

    if (!config.viewID) {
        return job_callback('viewID not found in configuration');
    }

    if (!config.metrics || !config.metrics.length) {
        return job_callback('no metrics provided');
    }

    if (!config.dimensions || !config.dimensions.length) {
        return job_callback('no dimensions provided');
    }

    //get key.p12 in Google Developer console
    //Extract it with : openssl pkcs12 -in key.p12 -nodes -nocerts > key.pem
    //Get config.authEmail in Google Developer console (Service Account)
    //Get config.viewID in Google Analytics Console : Admin -> View -> View Parameters -> View ID
    //Add GOOGLE_API_EMAIL in the Google Analytics account users

    var keyPath = path.resolve(__dirname, '../../../../ga-analytics-key.p12'); // wallboard root
    var authClient = new google.auth.JWT(
        config.authEmail,
        keyPath, //path to .pem
        null,
        // Scopes can be specified either as an array or as a single, space-delimited string
        [
            'https://www.googleapis.com/auth/analytics',
            'https://www.googleapis.com/auth/analytics.readonly'
        ]);


    var startDate = config.startDate || '7daysAgo';
    var endDate =  config.endDate || 'yesterday';

    authClient.authorize(function(err, tokens) {
        if (err) { return job_callback(err); }

        var options = {
            auth: authClient,
            "ids":'ga:'+config.viewID,
            "start-date":startDate,
            "end-date":endDate,
            "metrics":config.metrics.join(','),
            "dimensions":config.dimensions.join(',')

        };

        if (config.filters) {
            options.filters = config.filters;
        }

        analytics.data[config.realTime ? 'realtime' : 'ga'].get(options, function(err, data){
            job_callback(err, {
                data: data,
                safeConfig: safeConfig(config),
                title: config.title
            });
        });
    });
};