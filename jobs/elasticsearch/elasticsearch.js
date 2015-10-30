/**
 * Elastic search job
 *
 * Example configuration:
 *
 *   myconfigKey : {
 *     "interval": 10000,
 *     "widgetTitle": "Passivated / activated",
 *     "authName": "laas",
 *     "host": "localhost",
 *     "port": 9200,
 *     "searchQuery": {
 *       "index": "myindex*",
 *       "query": {
 *         "match_phrase": {
 *           "path": "/activation"
 *          }
 *       }
 *     },
 *     "chartConfig" : {
 *       "colors": ["green", "yellow", "red"],
 *       "xFormatter": "%e/%m"
 *     }
 *   }
 *
 */

module.exports = {

  onRun: function (config, dependencies, jobCallback) {

    if (!config.host || !config.port || !config.searchQuery || !config.searchQuery.index
        || !config.searchQuery.query) {
      return jobCallback('missing config');
    }

    if (!config.authName || !config.globalAuth[config.authName] ||
        !config.globalAuth[config.authName].username || !config.globalAuth[config.authName].password) {
      return jobCallback('missing auth config');
    }

    var request = dependencies.request;

    var options = {
      method: 'POST',
      url: 'https://' + config.host + ':' + config.port + '/' + config.index + '/_search',
      json: true,
      body: config.searchQuery,
      headers: {
        "authorization": "Basic " + new Buffer(config.globalAuth[config.authName].username + ":" +
        config.globalAuth[config.authName].password).toString("base64")
      }
    };

    request(options, function (err, httpResponse, body) {
      jobCallback(err, {
        data: body,
        jobConfig: _.omit(config, ['globalAuth'])
      });
    });
  }
};