/**
 * Elasticsearch time series job
 *
 * Example configuration:
 *
 *   myconfigKey : {
 *     "interval": 10000,
 *     "widgetTitle": "Passivated / activated",
 *     "authName": "laas",
 *     "host": "localhost",
 *     "port": 9200,
 *     "series": [
 *      {
 *        "name": "Reactivations",
 *        "color": "green",
 *        "renderer": "line",
 *         "index": "logs_prod*",
 *         "query": {
 *           "match_phrase": {
 *             "path": "/activation"
 *           }
 *         }
 *       },
 *       {
 *        "name": "Passivations",
 *        "color": "yellow",
 *        "renderer": "bar",
 *         "index": "logs_prod*",
 *         "query": {
 *           "match_phrase": {
 *             "path": "/passivation"
 *           }
 v         }
 *       },
 *     ],
 *     "groupBy": "1d",
 *     "chartConfig" : {
 *       "xFormatter": "%e/%m"
 *     }
 *   }
 *
 */

var queryBuilder = require('./query-builder');
var url = require('url');

module.exports = {

  onRun: function (config, dependencies, jobCallback) {

    if (!config || !config.host || !config.port || !config.groupBy
        || !config.series || !config.series.length) {
      return jobCallback('missing config');
    }

    if (!config.authName || !config.globalAuth[config.authName] || !config.globalAuth[config.authName].username
        || !config.globalAuth[config.authName].password) {
      return jobCallback('missing auth config');
    }

    var request = dependencies.request;
    var async = dependencies.async;
    var _ = dependencies.underscore;

    function massageDataset(buckets) {
      return buckets.map(function(bucket){
        return {
          time: bucket.key,
          value: bucket.doc_count
        };
      })
    }

    function doQuery(serie, cb) {
      if (!serie.index || !serie.query) {
        return cb('invalid config parameters for serie');
      }
      var queryUrl = url.format({
        protocol: 'https',
        host: config.host + ':'  + (config.port || 9200),
        pathname: serie.index + '/_search'
      });
      var options = {
        method: 'POST',
        url : queryUrl,
        json: true,
        body: queryBuilder.buildHistogramQuery(serie.query, config.groupBy),
        headers: {
          "authorization": "Basic " + new Buffer(config.globalAuth[config.authName].username + ":" +
              config.globalAuth[config.authName].password).toString("base64")
        }
      };

      request(options, function (err, httpResponse, body) {
        if (err || httpResponse.statusCode !== 200) {
          var msg = err ? err : 'status code: ' + httpResponse.statusCode + ' body: ' + JSON.stringify(body);
          return cb(msg);
        }
        cb(null, {
          data: massageDataset(body.aggregations.results.buckets),
          options: _.omit(serie, ['query', 'index'])
        });
      });
    }
    
    async.map(config.series, doQuery, function (err, data) {
      jobCallback(err, {
        data: data,
        jobConfig: _.omit(config, ['globalAuth'])
      });
    });
  }
};