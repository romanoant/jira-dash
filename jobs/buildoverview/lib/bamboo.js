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
            "authorization": bamboo.config.auth
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
            "authorization": bamboo.config.auth
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
      putCache: function(cacheKey, value) {
        cache.put(cacheKey, value, bamboo.config.cacheExpiration);
      },
      cachedCallback: function (cacheKey, callback) {
        return function (err, json) {
          if (!err) {
            bamboo.putCache(cacheKey, json);
          }
          callback(err, json);
        }
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
      getPlanInfo: function (plan, callback) {
        var cacheKey = bamboo.getCacheKey('result-latest-' + plan);
        var url = "/rest/api/latest/result/" + plan + "-latest.json";
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
      getPlansFromProject: function(projectKey, callback) {
        if (!projectKey) {
          return callback("missing projectKey parameter", null);
        }

        var url = "/rest/api/latest/result/" + projectKey + ".json";
        var cacheKey = bamboo.getCacheKey('result-' + projectKey);
        return bamboo.maybeCached(cacheKey, callback, function() {
          var cacheAwareCallback = bamboo.cachedCallback(cacheKey, callback);
          if (projectKey.indexOf("-") != -1) {
            // that's not a project - that's a plan!
            return cacheAwareCallback(null, [projectKey]);
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
                cacheAwareCallback(null, plans);
              }
            });
          }
        });
      }
    };
    bamboo.config = {
      cacheExpiration: 10 * 1000,
      timeout: 30 * 1000,
      auth: bamboo.createAuth(username, password),
      url: url
    };
    return bamboo;
  };
})();