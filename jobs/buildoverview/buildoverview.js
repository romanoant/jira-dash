var cheerio = require('cheerio'),
    async = require('async'),
    project_to_plans = require ('./lib/project_to_plans'),
    get_responsible = require ('./lib/get_responsible'),
    get_build_info = require ('./lib/get_build_info'),
    get_plan_info = require ('./lib/get_plan_info'),
    _ = require("underscore");

module.exports = function(config, dependencies, job_callback) {

    if (!config.globalAuth || !config.globalAuth.cbac ||
      !config.globalAuth.cbac.username || !config.globalAuth.cbac.password){
      return job_callback('no bamboo credentials found in buildoverview job. Please check global authentication file');
    }

    if (!config.bamboo_server){
        return job_callback("No bamboo server configured");
    }

    var logger = dependencies.logger;
    var self = this;
    var cbacAuth =  "Basic " + new Buffer(config.globalAuth.cbac.username + ":" + config.globalAuth.cbac.password).toString("base64");

    // get plan info with extra info if failed build
    var getData = function(plan, callback) {

        // get plan information from
        get_plan_info(plan, cbacAuth, config, dependencies.request, function (err, build){

            var result = {
                link : config.bamboo_server + "/browse/" + plan,
                planKey: plan,
                planName: plan,
                responsible: [],
                failBuildKey: "",
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

            if (build.state == "Successful") {
                result.success = "successful";
                callback(null, result);
            } else {
                get_build_info (plan, cbacAuth, config, dependencies.request, function (err, failed_build){

                    if (err || !failed_build){
                        result.down = true;
                        logger.error (err ? err : "error getting build infor for plan " + plan);
                        return callback(null, result);
                    }

                    result.failBuildKey = build.key;
                    result.isRefreshing = (failed_build.lifeCycleState == "NotBuilt");

                    get_responsible(build.key, cbacAuth, dependencies.request, config, function(err, users){
                        if (err || !failed_build){
                            result.down = true;
                            return callback(null, result);
                        }
                        result.success = "failed";
                        result.responsible = users;
                        callback(err, result);
                    });
                });
            }
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
               project_to_plans(build, cbacAuth, config, dependencies.request, function(err, plans){
                  if (err){
                   logger.error ("error accesing build \"" +  build + "\": " + err);
                   return callback(null, []); //we don't want the error to level up.
                  }
                  callback(null, plans);
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
        check_plans(builds, function(err, plans){
            if (err || !plans || !plans.length){
                return callback(err, []);
            }

            async.map(plans, getData, function(err, results){
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
    async.map(projects, execute_projects, function(err, results){
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
