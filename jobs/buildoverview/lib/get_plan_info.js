var cheerio = require('cheerio');
    cache = require('memory-cache');

// -------------------------------------------
//  Get plan info
// -------------------------------------------
var cache_expiration = 60 * 1000; //ms

module.exports = function(plan, cbacAuth, config, request, callback) {

    var cache_key = 'buildoverview-plan-' + plan + ':info';
    if (cache.get(cache_key)){
        return callback (null, cache.get(cache_key));
    }

    var options = {
        timeout: 15000,
        url: config.bamboo_server + "/rest/api/latest/result/" + plan + "-latest.json",
        headers: {
            "authorization": cbacAuth
        }
    };

    request(options, function(err, response, body) {
        if (err || !response || response.statusCode != 200) {
            var err_msg = err || "bad response from " + options.url + (response ? " - status code: " + response.statusCode : "");
            callback(err || err_msg);
        } else {
            var json_body;
            try{
                json_body = JSON.parse(body);
            }
            catch (e) {
                return callback(e, null);
            }
            cache.put(cache_key, json_body, cache_expiration); //add to cache
            callback(null, json_body);
        }
    });
};
