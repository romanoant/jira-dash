/*

  Buildoverview job.

  "buildoverview-UI" : {
    "bamboo_server" : "https://confluence-bamboo.internal.atlassian.com",
    "retryOnErrorTimes" : 3,
    "interval" : 120000,
    "failBuilds":["CONFUI-QUNITFFESR", "CONFUI-QUNITFFLATEST", "CONFUI-QUNITCHROMEPLUGINS" , 
                  "CONFUI-QUNITCHROMELATEST", "CONFUI-QUNITQCCHROMELATEST", "CONFUI-QUNITQCFFLATEST", 
                  "CONFUI-QUNITQEFFLATEST11", "CONFUI-QUNITIE9"],
    "showBuilds":[],
    "widgetTitle" : "QUNIT BUILDS",
    "showResponsibles" : false
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

    if (!config.globalAuth || !config.globalAuth[authName] ||
      !config.globalAuth[authName].username || !config.globalAuth[authName].password){
      return job_callback('no bamboo credentials found in buildoverview job. Please check global authentication file');
    }

    if (!config.bamboo_server){
      return job_callback("No bamboo server configured");
    }

    var logger = dependencies.logger;

    var username = config.globalAuth[authName].username;
    var password = config.globalAuth[authName].password;
    var bamboo = new Bamboo(config.bamboo_server, username, password, dependencies.request, cache, cheerio);

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

        result.planName = build.planName;
	if (build.plan && build.plan.type === 'chain_branch') {
          result.planName = build.plan.name;
        }

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
            result.progress = runningBuildStatus.progress.percentageCompletedPretty;
            result.timeRemaining = runningBuildStatus.progress.prettyTimeRemaining.replace(' remaining', '');
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
          results = results.filter (function(result) { return result.enabled; });
          callback(err, results);
        });
      });
    }

    // ------------------------------------------
    // MAIN
    // ------------------------------------------

    //sort function for consistent build listing
    var failure_sort = function(a, b) {
      function score (build){
        return build.down === true ? 20 : (build.success === "failed" ? 10 : 0);
      }
      return score(a) > score(b);
    };

    var planDefinitions = [_.compact(config.failBuilds), _.compact(config.showBuilds)];
    return async.map(planDefinitions, execute_planDefinitions, function(err, results){
      if (err){
        logger.error(err);
        job_callback(err);
      }
      else{
        job_callback(null, {
          showBuilds: results[1].sort(failure_sort),
          failBuilds: results[0].sort(failure_sort),
          title: config.widgetTitle,
          showResponsibles: config.showResponsibles !== false
        });
      }
    });
};
