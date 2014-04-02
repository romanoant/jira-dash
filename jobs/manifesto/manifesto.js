var _ = require("underscore"),
  extend = require("node.extend"),
  request = require("request");

module.exports = function(config, dependencies, job_callback) {

  if (!config.plugins) {
    return job_callback("No plugins configured");
  }

  if (!config.environments) {
    return job_callback("No environments configured");
  }

  var logger = dependencies.logger;


  var defaultColors = {
    "jirastudio-dev": "orange",
    "jirastudio-dog": "blue",
    "jirastudio-prd-virtual": "yellow",
    "jirastudio-prd": "green"
  };
  // valid colors: red, yellow, blue, green, orange, lightblue

  var envColors = extend({}, defaultColors, config.colors || {});

  // get plan info with extra info if failed build
  var getData = function() {

    var options = {
      url: "https://manifesto.uc-inf.net/api/summary",
      json: true
    };

    request(options, function(err, response, body) {
      if (err || !response || response.statusCode != 200) {
        var errMsg = "bad response from " + options.url + (response ? " - status code: " + response.statusCode : "");
        console.log("ERROR", err || errMsg);
        return job_callback(err || errMsg);
      } else {
        try {
          var results = extractResult(body);
          return job_callback(null, results);
        } catch (e) {
          console.log("ERROR", e);
          return job_callback(e, null);
        }
      }
    });
  };

  var extractResult = function(body) {
    var filteredEnvironments = _.filter(body.environments, function(e) {
      return _.contains(config.environments, e.environment);
    })

    _.each(filteredEnvironments, function(e) {
      e.color = envColors[e.environment];
      e.products = _.filter(e.products, function(p) {
        return (config.products ? _.contains(config.products, p.name) : true);
      });

      _.each(e.products, function(product) {
        product.plugins = _.filter(product.plugins, function(p) {
          return _.contains(config.plugins, p.name);
        });
      });
    });

    return filteredEnvironments;
  };

  getData();
};