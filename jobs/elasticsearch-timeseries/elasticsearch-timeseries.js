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
      });
    }

    function authHeader() {
      return "Basic " + new Buffer(config.globalAuth[config.authName].username + ":" +
              config.globalAuth[config.authName].password).toString("base64");
    }

    function getIndices(query, cb) {
      // If configured index does not contain wildcard, return as configured
      if (!query.index.endsWith('*')) {
        return cb(null, {indices: [query.index]});
      }

      var options = {
        method: 'POST',
        url: 'https://' + config.host + ':' + config.port + '/' + query.index + '/_field_stats?level=indices',
        json: true,
        body: {
          "fields": ["@timestamp"]
        },
        headers: {
          "authorization": authHeader()
        }
      };
      request(options, function (err, httpResponse, body) {
        if (err || httpResponse.statusCode !== 200) {
          return cb(err ? err : 'status code: ' + httpResponse.statusCode);
        }
        cb(null, {indices: _.keys(body.indices)});
      });
    }

    function doQuery(serie, cb) {
      if (!serie.index || !serie.query) {
        return cb('invalid config parameters for serie');
      }

      getIndices(serie, function (error, data) {
        if (error) {
          return cb(error);
        }

        if (_.isEmpty(data.indices)) {
          return cb('no indices found for ' + serie.index);
        }

        var queryUrl = url.format({
          protocol: 'https',
          host: config.host + ':'  + (config.port || 9200),
          pathname: data.indices.join() + '/_search'
        });

        var options = {
          method: 'POST',
          url : queryUrl,
          json: true,
          body: queryBuilder.buildHistogramQuery(serie.query, config.groupBy, config.queryOptions),
          headers: {
            "authorization": authHeader()
          }
        };

        request(options, function (err, httpResponse, body) {
          if (err || httpResponse.statusCode !== 200) {
            var msg = err ? err : 'status code: ' + httpResponse.statusCode + ' body: ' + JSON.stringify(body);
            return cb(msg);
          }
          if (!body.aggregations || !body.aggregations.results) {
            return cb('Unexpected data received');
          }
          cb(null, {
            data: massageDataset(body.aggregations.results.buckets),
            options: _.omit(serie, ['query', 'index'])
          });
        });
      });
    }

    var enabledSeries = config.series.filter(function(serie){ return serie.enabled !== false});
    async.map(enabledSeries, doQuery, function (err, data) {
      jobCallback(err, {
        data: data,
        jobConfig: _.omit(config, ['globalAuth'])
      });
    });
  }
};