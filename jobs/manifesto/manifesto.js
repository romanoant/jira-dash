var extend = require("node.extend");

module.exports = function(config, dependencies, job_callback) {

  if (!config.plugins && !config.products) {
    return job_callback("No plugins or products configured");
  }

  if (!config.environments) {
    return job_callback("No environments configured");
  }

  var _ = dependencies.underscore,
      request = dependencies.easyRequest,
      logger = dependencies.logger;


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
      timeout: config.timeout || 15000,
      url: "https://manifesto.uc-inf.net/api/summary"
    };

    request.JSON(options, function(error, manifestoData) {
      if (error) {
        return job_callback(error);
      }

      var results = extractResult(manifestoData);
      return job_callback(null, results);
    });
  };

  var extractResult = function(data) {
    var filteredEnvironments = _.filter(data.environments, function(e) {
      return _.contains(config.environments, e.environment);
    })

    _.each(filteredEnvironments, function(e) {
      e.color = envColors[e.environment];
      e.products = _.filter(e.products, function(p) {
        return (config.products ? _.contains(config.products, p.name) : true);
      });

      _.each(e.products, function(product) {
        product.plugins = _.filter(product.plugins, function(p) {
          return (config.plugins ? _.contains(config.plugins, p.name) : true);
        });
      });
    });

    return filteredEnvironments;
  };

  getData();
};