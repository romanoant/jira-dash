(function () {

  var asyncLimit = 20; //number of simultaneous requests per bamboo instance
  var maxQueueSize = 10000;

  var cookieJars = {};

  // remember cookies per bamboo instance and credentials so that session id could be reused
  function getCookieJar(url, auth, jarSupplier) {
    var key = url + auth;
    if (!cookieJars[key]) {
      cookieJars[key] = jarSupplier();
    }
    return cookieJars[key];
  }

  var queues = {};
  // remember queue per bamboo instance to minimize concurrency
  function getQueue(url, queueSupplier, worker) {
    var key = url;
    if (!queues[key]) {
      queues[key] = queueSupplier(worker, asyncLimit);
    }
    return queues[key];
  }

  // map of cache keys to lists of callbacks that should be called when loading of value for those keys is finished
  var currentLoaders = {};

  //noinspection UnnecessaryLocalVariableJS
  module.exports = function (url, credentials, dependencies) {

      var request = dependencies.request,
          cache = dependencies.cache,
          cheerio = dependencies.cheerio,
          async = dependencies.async,
          logger = dependencies.logger;

    var bamboo = {
      createAuth: function (username, password) {
        return "Basic " + new Buffer(username + ":" + password).toString("base64");
      },
      getBuildStatus: function (buildWithNumber, callback) {
        var url = "/rest/api/latest/result/status/" + buildWithNumber + ".json";
        bamboo.getResponse(url, function (err, json_body, response) {
          if (err) {
            if (response && response.statusCode == 404) {
              // this build is not running
              return callback(null, {
                finished: true
              });
            } else {
              return callback(err);
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
      getQueueInfo: function (callback) {
        var url = "/rest/api/latest/queue.json?expand=queuedBuilds";
        bamboo.getJsonResponse(url, callback);
      },
      getResponse: function(urlPath, callback) {
          var key = bamboo.getCacheKey('urlPath-' + urlPath);
          bamboo.getFromCacheOrLoad(key, callback, function (callback)  {
              bamboo._getQueuedResponse(urlPath, callback)
          });
      },
      _getQueuedResponse: function (urlPath, callback) {
          if(queue.length() == maxQueueSize) {
              var err_msg = "Could not add request to queue for bamboo [" + bamboo.config.url + "] as it already reached its limit of " + maxQueueSize;
              return callback(err_msg);
          }
          queue.push(function (queueCallback) {
              bamboo._getResponse(urlPath, function(err, body, response) {
                  callback(err, body, response);
                  queueCallback();
              });
          });
      },
      _getResponse: function (urlPath, callback) {
        var options = {
          timeout: bamboo.config.timeout,
          url: bamboo.config.url + urlPath,
          headers: {
            "accept": "application/json"
          },
          jar: getCookieJar(bamboo.config.url, bamboo.config.auth, request.jar)
        };
        request(options, function (err, response, body) {
          function handleError(err, response) {
            var err_msg = err || "bad response from " + options.url + (response ? " - status code: "
                + response.statusCode : "");
            return callback(err || err_msg, null, response);
          }

          if (err || !response || response.statusCode != 200) {
            if (response && response.statusCode == 401) {
              options.headers = {
                "authorization": bamboo.config.auth,
                "accept": "application/json"
              };
              request(options, function (err, response, body) {
                if (err || !response || response.statusCode != 200) {
                  return handleError(err, response);
                } else {
                  return callback(null, body, response);
                }
              });
            } else {
              return handleError(err, response);
            }
          } else {
            return callback(null, body, response);
          }
        })
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
        getFromCacheOrLoad: function getFromCacheOrLoad(cacheKey, callback, loader) {
            var cachedValue = cache.get(cacheKey);
            if (cachedValue) {
                return callback(cachedValue.err, cachedValue.response, cachedValue.body);
            }
            else {
                if(currentLoaders[cacheKey]) {
                    return currentLoaders[cacheKey].push(callback);
                } else {
                    currentLoaders[cacheKey] = [callback];
                    return loader(function(err, response, body) {
                        var callbacks = currentLoaders[cacheKey];
                        delete currentLoaders[cacheKey];
                        bamboo.putCache(cacheKey, {err: err, response: response, body: body});
                        callbacks.forEach(function(callback){
                            callback(err, response, body);
                        });
                    })
                }
            }
        },

      getCacheKey: function(target) {
        return 'bamboo:server-' + bamboo.config.url + ':auth-' + bamboo.config.auth + ':' + target;
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

        var url = "/rest/api/latest/result/" + projectKey + ".json?max-result=1000";
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
      },

      /**
       * Returns the URL of a .png image file containing a graph of build durations over a period of time.
       *
       * @param {string} plan Plan key
       * @param {int} width the required width of the image file
       * @param {int} height the required height of the image file
       * @param {string} dateRange one of "LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS", "ALL"
         */
      getBuildTimeChartUrl: function(planKey, width, height, dateRange, callback) {
        if (!planKey) {
          return callback("missing planKey parameter");
        }

        var url = "/rest/api/latest/chart.json" +
            "?buildKeys=" + planKey +
            "&reportKey=com.atlassian.bamboo.plugin.system.reports:averageDuration" +
            "&groupByPeriod=AUTO" +
            "&dateFilter=" + dateRange +
            "&width=" + width + 
            "&height=" + height;

        return bamboo.getJsonResponse(url, function(err, json) {
          if (err) {
            callback(err);
          } else {
            var imageUrl = bamboo.config.url + "/chart?filename=" + json.location
            callback(null, imageUrl, json.width, json.height)
          }
        });
      },
      getPlansForLabels: function (labels, callback) {
          if (!labels) {
              return callback("missing label parameter", null);
          }

          if (labels.length == 0) {
              return callback(null, []);
          }

          var url = "/rest/api/latest/plan.json";
          bamboo.getJsonResponse(url, function (err, json) {
              if (err) return callback(err);

              var size = json.plans.size;
              bamboo.getJsonResponse(url + '?max-result=' + size, function (err, json) {
                  if (err) return callback(err);

                  var checkPlan = function checkPlan(plan, callback) {
                      bamboo.getJsonResponse('/rest/api/latest/plan/' + plan + '/label.json', function (err, json) {
                          if (err) return callback(err);

                          logger.log(plan + " has " + json.labels.size + " labels.");
                          callback(null, {
                              plan: plan,
                              labels: json.labels.label.map(function (label) {
                                  return label.name;
                              })
                          });
                      });
                  };
                  var plans = json.plans.plan.map(function (plan) {
                      return plan.key;
                  });
                  var tasks = plans.map(function (plan) {
                      return checkPlan.bind(this, plan);
                  });
                  async.parallel(tasks, function processPlans(err, plans) {
                      if (err) return callback(err);

                      var plansWithLabels = plans.filter(function (plan) {
                          return _.intersection(plan.labels, labels).length > 0
                      }).map(function (plan) {
                          return plan.plan;
                      });
                      logger.log("Plans with labels [" + labels + "] are: [" + plansWithLabels + "]");
                      callback(null, plansWithLabels)
                  });
              });
          });
      }
    };

    bamboo.config = {
      cacheExpiration: 60 * 1000,
      plansToProjectsCacheExpiration: 5 * 60 * 1000,
      timeout: 60 * 1000,
      auth: bamboo.createAuth(credentials.username, credentials.password),
      url: url
    };
    var queue = getQueue(bamboo.config.url, async.queue, function (task, callback) {
      task(callback);
    });
    return bamboo;
  };

})();