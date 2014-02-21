(function () {

  //noinspection UnnecessaryLocalVariableJS
  module.exports = function (url, username, password, request, cache, cheerio) {
    var bamboo = {
      createAuth: function (username, password) {
        return "Basic " + new Buffer(username + ":" + password).toString("base64");
      },
      getBuildStatus: function (buildWithNumber, callback) {

        var options = {
          timeout: bamboo.config.timeout,
          url: bamboo.config.url + "/rest/api/latest/result/status/" + buildWithNumber + ".json",
          headers: {
            "authorization": bamboo.config.auth,
            "accept": "application/json"
          }
        };

        request(options, function (err, response, json_body) {
          if (err || !response || response.statusCode != 200) {
            if (!err && response && response.statusCode == 404) {
              // this build is not running
              return callback(null, {
                finished: true
              });
            }
            else {
              var errMsg = "bad response from " + options.url
                  + (response ? " - status code: " + response.statusCode : "");
              return callback(err || errMsg);
            }
          } else {
            try {
              return callback(null, JSON.parse(json_body));
            }
            catch (e) {
              return callback(e, null);
            }
          }
        });

      },
      getResponse: function(urlPath, callback) {
        var options = {
          timeout: bamboo.config.timeout,
          url: bamboo.config.url + urlPath,
          headers: {
            "authorization": bamboo.config.auth,
            "accept": "application/json"
          }
        };
        request(options, function (err, response, body) {
          if (err || !response || response.statusCode != 200) {
            var err_msg = err || "bad response from " + options.url + (response ? " - status code: "
                + response.statusCode : "");
            return callback(err || err_msg, null, response);
          } else {
            return callback(null, body, response);
          }
        });
      },
      getJsonResponse: function (urlPath, callback) {
        bamboo.getResponse(urlPath, function(err, body) {
          if (err) {
            return callback(err, body);
          }
          else {
            var json_body;
            try {
              json_body = JSON.parse(body);
            }
            catch (e) {
              return callback(e, null);
            }
            return callback(null, json_body);
          }
        });
      },
      getCachedJsonResponse: function (cacheKey, url, callback) {
        bamboo.maybeCached(cacheKey, callback, function () {
          bamboo.getJsonResponse(url, bamboo.cachedCallback(cacheKey, callback));
        });
      },

      /**
       * Add item to cache.
       *
       * @param {string} cacheKey 
       * @param {object} value 
       * @param {number} [expiration="bamboo.config.cacheExpiration"] expiration in ms or use bamboo.config.cacheExpiration
       */
      putCache: function(cacheKey, value, expiration) {
        cache.put(cacheKey, value, expiration || bamboo.config.cacheExpiration);
      },

      /**
       * Handle callback storing the value in cache if successful.
       *
       * @param {string} cacheKey 
       * @param {function} callback
       * @param {number} [expiration="bamboo.config.cacheExpiration"] expiration in ms or use bamboo.config.cacheExpiration
       */
      cachedCallback: function (cacheKey, callback, expiration) {
        return function (err, json) {
          if (!err) {
            bamboo.putCache(cacheKey, json, expiration);
          }
          callback(err, json);
        };
      },

      maybeCached: function (cacheKey, callback, notCachedCallback) {
        var cachedValue = cache.get(cacheKey);
        if (cachedValue) {
          return callback(null, cachedValue);
        }
        else {
          return notCachedCallback(cacheKey, callback);
        }
      },
      getCacheKey: function(target) {
        return 'bamboo:server-' + bamboo.config.url + ':' + target;
      },

     /**
      * Get latest build result for a particular plan
      *
      * @param {string} plan Plan key
      */
      getPlanLatestBuildResult: function (planKey, callback) {
        var cacheKey = bamboo.getCacheKey('result-latest-' + planKey);
        var url = "/rest/api/latest/result/" + planKey + "-latest.json";
        bamboo.getCachedJsonResponse(cacheKey, url, callback);
      },

      getResponsible: function (buildKey, callback) {
        if (!buildKey){
          return callback("build key not found");
        }

        var cacheKey = bamboo.getCacheKey('browse-' + buildKey);
        return bamboo.maybeCached(cacheKey, callback, function() {
          var url = "/browse/" + buildKey;
          bamboo.getResponse(url, function(err, body) {
            if (err) {
              callback(err);
            } else {
              var users = [];
              var $ = cheerio.load(body);
              var responsibleBlock = $('.responsible-summary', '#page');

              responsibleBlock.children('ul').children('li').each(function(i, el) {
                var avatarSrc = $(el).children('img').attr('src');
                var name = $(el).children('a').text().trim();

                if (!avatarSrc) {
                  //if we can't find their avatar, use the default gravatar mystery man one
                  //avatarSrc = "http://www.gravatar.com/avatar/00000000000000000000000000000000?d=mm"
                  avatarSrc = "";
                }

                users.push({name: name, avatar: avatarSrc.substr(0, avatarSrc.indexOf('?'))});
              });

              bamboo.cachedCallback(cacheKey, callback)(null, users);
            }
          });
        });
      },

      /**
       * Returns plans for a certain project key
       * 
       * @param {string} projectKey Project or plan key. If a project key is passed, 
       *     it will fetch the underlying plans for that particular project
       */
      getPlansFromProject: function(projectKey, callback) {
        if (!projectKey) {
          return callback("missing projectKey parameter");
        }

        var url = "/rest/api/latest/result/" + projectKey + ".json";
        var cacheKey = bamboo.getCacheKey('result-' + projectKey);
        return bamboo.maybeCached(cacheKey, callback, function() {
          var cacheAwareCallback = bamboo.cachedCallback(cacheKey, callback);
          if (projectKey.indexOf("-") != -1) {
            // that's not a project - that's a plan!
            return cacheAwareCallback(null, [projectKey], bamboo.config.plansToProjectsCacheExpiration);
          }
          else {
            return bamboo.getJsonResponse(url, function(err, json) {
              if (err) {
                callback(err);
              }
              else {
                var plans = [];
                json.results.result.forEach(function(plan) {
                  var planKeyArray = plan.key.split("-");
                  planKeyArray.pop();
                  var planKey = planKeyArray.join("-");
                  if (plans.indexOf(planKey) == -1) {
                    plans.push(planKey);
                  }
                });
                cacheAwareCallback(null, plans, bamboo.config.plansToProjectsCacheExpiration);
              }
            });
          }
        });
      }
    };

    bamboo.config = {
      cacheExpiration: 60 * 1000,
      plansToProjectsCacheExpiration: 5 * 60 * 1000,
      timeout: 60 * 1000,
      auth: bamboo.createAuth(username, password),
      url: url
    };

    return bamboo;
  };

})();