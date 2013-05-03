// -------------------------------------------
//  Get plans for a project
// -------------------------------------------
var cache = require('memory-cache');

var cache_expiration = 10 * 60 * 1000; //ms

module.exports = function (project, cbacAuth, config, request, callback) {

    if (!project) {
        return callback("missing project parameter", null);
    }

    var plans = [];

    //cache hit?
    var cache_key = 'buildoverview-project-' + project + ':plans';
    if (cache.get(cache_key)){
        return callback(null, cache.get(cache_key));
    }

    if (project.indexOf("-") != -1) {
        plans.push(project); // no dash, so assume this is a plan key.
        callback(null, plans);
    } else {

        //input is a Project Key - get all plans in this project
        var options = {
            timeout: 15000,
            url: config.bamboo_server + "/rest/api/latest/result/" + project + ".json",
            headers: {
                "authorization": cbacAuth
            }
        };

        request(options, function(err, response, jsonBody) {
            if (err || !response || response.statusCode != 200) {
                var err_msg = err || "bad response from " + options.url + (response ? " - status code: " + response.statusCode : "");
                callback(err || err_msg);
            } else {
                var body = JSON.parse(jsonBody);
                body.results.result.forEach(function(plan) {
                    var planKeyArray = plan.key.split("-");
                    planKeyArray.pop();
                    var planKey = planKeyArray.join("-");
                    if (plans.indexOf(planKey) == -1) {
                        plans.push(planKey);
                    }
                });
                cache.put(cache_key, plans, cache_expiration);
                callback(null, plans);
            }
        });
    }
};
