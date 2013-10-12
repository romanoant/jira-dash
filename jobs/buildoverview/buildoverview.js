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
    var getData = function(plan, callback) {

      // get plan information from
      bamboo.getPlanInfo(plan, function (err, build) {

        var result = {
          link : config.bamboo_server + "/browse/" + plan,
          planKey: plan,
          planName: plan,
          responsible: [],
          isRefreshing: false,
          success : "",
          down : false
        };

        if (err || !build){
          result.down = true;
          logger.error (err ? ("error accessing build info for plan " + plan + ": " + err) : "non build info available for plan " + plan);
          // we don´t pass the error to the caller. we just mark it as down.
          return callback(null, result);
        }

        result.planName = build.planName;

        // Find if there is next build in-progress
        var possiblyInProgressBuild = build.key.replace('-' + build.number, '-' + (build.number + 1));
        return bamboo.getBuildStatus(possiblyInProgressBuild, function (err, runningBuildStatus) {
          if (err || !runningBuildStatus){
            result.down = true;
            logger.error (err ? err : "error getting build info for plan " + plan);
            return callback(null, result);
          }

          result.isRefreshing = !runningBuildStatus.finished;
          if (result.isRefreshing) {
            result.progress = runningBuildStatus.progress.percentageCompletedPretty;
            result.timeRemaining = runningBuildStatus.progress.prettyTimeRemaining.replace(' remaining', '');
          }

          if (build.state == "Successful") {
            result.success = "successful";
            return callback(null, result);
          } else {
            // get some more details, which are not included in plan overview
            result.failedTestCount = build.failedTestCount;
            result.testCount = build.failedTestCount + build.quarantinedTestCount + build.successfulTestCount;
            result.successfulTestCount = build.successfulTestCount;
            result.quarantinedTestCount = build.quarantinedTestCount;

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

    // -----------------------
    // fetch plans
    // -----------------------
    function check_plans(builds, callback) {
       if (!builds || !builds.length) {
          callback(null, []);
       } else {
         var fetcher = function (build, callback) {
           bamboo.getPlansFromProject(build, function (err, plans) {
            if (err){
             logger.error ("error accesing build \"" +  build + "\": " + err);
             return callback(null, []); //we don't want the error to level up.
            }
            return callback(null, plans);
           });
          };

         async.map(builds, fetcher, function(err, results){
           callback(err, _.flatten(results));
         });
       }
    }

    function execute_projects(builds, callback){
      if (!builds || !builds.length){
        return callback (null, []);
      }
      return check_plans(builds, function(err, plans){
        if (err || !plans || !plans.length){
          return callback(err, []);
        }

        return async.map(plans, getData, function(err, results){
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

    var projects = [_.compact(config.failBuilds), _.compact(config.showBuilds)];
    return async.map(projects, execute_projects, function(err, results){
      if (err){
        logger.error(err);
        job_callback(err);
      }
      else{
        job_callback(null, {
          showBuilds: results[1].sort(failure_sort),
          failBuilds: results[0].sort(failure_sort),
          title: config.widgetTitle
        });
      }
    });
};
