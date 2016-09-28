/*

  Buildoverview job.

  "buildoverview-UI" : {
    "bamboo_server" : "https://collaboration-bamboo.internal.atlassian.com",
    "retryOnErrorTimes" : 3,
    "interval" : 120000,
    "failBuilds":["CONFUI-QUNITFFESR", "CONFUI-QUNITFFLATEST", "CONFUI-QUNITCHROMEPLUGINS" ,
                  "CONFUI-QUNITCHROMELATEST", "CONFUI-QUNITQCCHROMELATEST", "CONFUI-QUNITQCFFLATEST",
                  "CONFUI-QUNITQEFFLATEST11", "CONFUI-QUNITIE9"],
    "showBuilds":[],
    "widgetTitle" : "QUNIT BUILDS",
    "showResponsibles" : false,
    "sortBuilds" : true // this is the default if the config option is not specified
  }

 */

var async = require('async'),
    Bamboo = require('./lib/bamboo.js'),
    cache = require('memory-cache'),
    cheerio = require('cheerio');
    _ = require("underscore");

module.exports = function(config, dependencies, job_callback) {

    // fallback to for configuration compatibility
    var authName = config.authName || 'cbac';
    var labels = config.labels || [];
    var showDisabled = config.showDisabled || false;

    if (!config.globalAuth || !config.globalAuth[authName] ||
      !config.globalAuth[authName].username || !config.globalAuth[authName].password){
      return job_callback('No Bamboo credentials found in buildoverview job for authName \'' + authName + '\'. Please check global authentication file');
    }

    if (!config.bamboo_server){
      return job_callback("No bamboo server configured");
    }

    var logger = dependencies.logger;

    var credentials = {
        username: config.globalAuth[authName].username,
        password: config.globalAuth[authName].password
    };
    var bamboo = new Bamboo(config.bamboo_server, credentials, {
        request: dependencies.request,
        cache: cache,
        cheerio: cheerio,
        async: async,
        logger: logger
    });

    // get display name of a plan or plan branch
    var getPlanName = function(build) {
      if (build.plan && build.plan.type === 'chain_branch') {
        if (build.plan.master && build.plan.master.shortName) {
          return build.plan.master.shortName + ' - ' + build.planName;
        } else {
          return build.plan.name;
        }
      } else {
        return build.planName;
      }
    };

    // get plan info with extra info if failed build
    var getData = function(planKey, callback) {

      // get plan information from
      bamboo.getPlanLatestBuildResult (planKey, function (err, build) {

        var result = {
          link : config.bamboo_server + "/browse/" + planKey,
          planKey: planKey,
          planName: planKey,
          responsible: [],
          isRefreshing: false,
          success : "",
          down : false
        };

        if (err || !build){
          result.down = true;
          logger.error (err ? ("error accessing build info for plan " + planKey + ": " + err) : "non build info available for plan " + planKey);
          // we don´t pass the error to the caller. we just mark it as down.
          return callback(null, result);
        }

        result.enabled = build.plan.enabled;

        if (!build.plan.enabled) { // plan is disabled. We can filter general results for disabled plans
          return callback(null, result);
        }

        result.planName = getPlanName(build);

        // Find if there is next build in-progress
        var possiblyInProgressBuild = build.key.replace('-' + build.number, '-' + (build.number + 1));
        return bamboo.getBuildStatus(possiblyInProgressBuild, function (err, runningBuildStatus) {
          if (err || !runningBuildStatus){
            result.down = true;
            logger.error (err ? err : "error getting build info for plan " + planKey);
            return callback(null, result);
          }

            result.isRefreshing = !runningBuildStatus.finished;
            if (result.isRefreshing) {
                if (runningBuildStatus.progress) {
                    result.progress = runningBuildStatus.progress.percentageCompletedPretty;
                    result.timeRemaining = runningBuildStatus.progress.prettyTimeRemaining.replace(' remaining', '');
                } else {
                    result.progress = 0;
                    result.timeRemaining = "";
                }
            }

          result.failedTestCount = build.failedTestCount;
          result.testCount = build.failedTestCount + build.quarantinedTestCount + build.successfulTestCount;
          result.successfulTestCount = build.successfulTestCount;
          result.quarantinedTestCount = build.quarantinedTestCount;

          if (build.state == "Successful") {
            result.success = "successful";
            return callback(null, result);
          } else {
            // get some more details, which are not included in plan overview
            return bamboo.getResponsible(build.key, function(err, users){
              if (err || !users){
                result.down = true;
                return callback(null, result);
              }
              result.success = "failed";
              result.responsible = users;
              return callback(err, result);
            });
          }
        });
      });
    };

    /**
     * Flattens plan definitions into plans. (A plan definition can be a project, which can contains several plans)
     *
     * @param {Array} planDefinitions Plans or projects to be flattened into plans
     */
    function convertToPlans(planDefinitions, callback) {
       if (!planDefinitions || !planDefinitions.length) {
          callback(null, []);
       } else {
         var fetcher = function (project, callback) {
           bamboo.getPlansFromProject(project, function (err, plans) {
            if (err){
             logger.error ("error accesing project \"" +  project + "\": " + err);
             return callback(null, []); //we don't want the error to level up.
            }
            return callback(null, plans);
           });
          };

         async.map(planDefinitions, fetcher, function(err, results){
           callback(err, _.flatten(results));
         });
       }
    }

    /**
     * Execute plans or projects contained on the planDefinitions
     *
     * @param {Array} planDefinitions Plan or projects containing plans.
     */
    function execute_planDefinitions(planDefinitions, callback){
      if (!planDefinitions || !planDefinitions.length){
        return callback (null, []);
      }
      return convertToPlans(planDefinitions, function(err, plans){
        if (err || !plans || !plans.length){
          return callback(err, []);
        }

        return async.map(plans, getData, function(err, results){
          results = results.filter (function(result) { return result.enabled || showDisabled; });
          callback(err, results);
        });
      });
    }

    function showPlans(plansForLabels) {
        //sort function for consistent build listing
        var failure_sort = function (a, b) {
            function score(build) {
                if (build.down === true) {
                    return 20;
                } else if (build.disabled === true) {
                    return 15;
                } else if (build.success === "failed") {
                    if (build.responsible.length === 1) {
                        return build.responsible[0].name.indexOf('Assign responsibility') === -1 ? 5 : 10;
                    } else {
                        return 10;
                    }
                } else {
                    return 0;
                }
            }
            return score(b) - score(a);
        };

        if (typeof config.sortBuilds == "undefined") {
            config.sortBuilds = true;
        }

        var hallOfShame = _.union(config.failBuilds, _.difference(plansForLabels, config.showBuilds));
        var planDefinitions = [_.compact(hallOfShame), _.compact(config.showBuilds)];

        // creates callback wrapper that logs error and executes callback
        var logErrorCallbackWrapper = function (callback) {
            return function (err, results) {
                if (err) {
                    logger.error(err);
                }
                callback(err, results);
            }
        };

        async.parallel([
            function getProjectsDetails(callback) {
                async.map(planDefinitions, execute_planDefinitions, logErrorCallbackWrapper(callback));
            },
            function getQueueInfo(callback) {
                bamboo.getQueueInfo(logErrorCallbackWrapper(callback));
            }
        ], function (err, results) {
            if (err) {
                // error was logged in original function, don't log it again
                job_callback(err);
            }
            else {

                var projectsDetailsResult = results[0];
                var queueInfoResult = results[1];

                var showBuilds = projectsDetailsResult[1],
                    failBuilds = projectsDetailsResult[0];
                if (config.sortBuilds) {
                    showBuilds = showBuilds.sort(failure_sort);
                    failBuilds = failBuilds.sort(failure_sort);
                }

                job_callback(null, {
                    showBuilds: showBuilds,
                    failBuilds: failBuilds,
                    title: config.widgetTitle,
                    queue: queueInfoResult,
                    showQueueInfo: config.showQueueInfo || false,
                    showResponsibles: config.showResponsibles !== false,
                    showDown: config.showDown || false
                });
            }
        });
    }

    // ------------------------------------------
    // MAIN
    // ------------------------------------------

    if(!this.plansForLabels) {
		var job = this;
		bamboo.getPlansForLabels(labels, function(err, plansForLabels) {
			if (err) {
				job_callback(err);
			} else {
				job.plansForLabels = plansForLabels;
				showPlans(plansForLabels);
			}
		});
	} else {
		showPlans(this.plansForLabels);
	}
};
