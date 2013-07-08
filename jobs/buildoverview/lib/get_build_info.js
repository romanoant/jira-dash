var cheerio = require('cheerio'),
    cache = require('memory-cache');

// -------------------------------------------
//  Get build info
// -------------------------------------------
var cache_expiration = 60 * 1000; //ms

module.exports = function(build, cbacAuth, config, request, callback) {

    var cache_key = 'buildoverview-build-' + build + ':server-' + config.bamboo_server + ':info';
    if (cache.get(cache_key)){
        return callback (null, cache.get(cache_key));
    }

    var options = {
        timeout: 15000,
        url: config.bamboo_server + "/rest/api/latest/result/" + build + "-latest.json?includeAllStates",
        headers: {
            "authorization": cbacAuth
        }
    };

    request(options, function(err, response, json_body) {
        if (err || !response || response.statusCode != 200) {
            var err_msg = err || "bad response from " + options.url + (response ? " - status code: " + response.statusCode : "");
            callback(err || err_msg);
        } else {
            var build;
            try{
                build = JSON.parse(json_body);
            }
            catch (e) {
                return callback(e, null);
            }
            cache.put(cache_key, build, cache_expiration); //add to cache
            callback(null, build);
        }
    });

};
