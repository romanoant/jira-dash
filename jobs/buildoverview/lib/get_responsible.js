var cheerio = require('cheerio'),
    cache = require('memory-cache');
// -------------------------------------------
//  Get the responsable for an specific build.
// -------------------------------------------

var cache_expiration = 60 * 1000; //ms

module.exports = function(buildKey, cbacAuth, request, config, callback) {

    if (!buildKey){
        return callback("build key not found");
    }

    var cache_key = 'buildoverview-build-' + buildKey + ':' + ':server-' + config.bamboo_server + ':responsibles';
    if (cache.get(cache_key)){
        return callback (null, cache.get(cache_key));
    }

    var options = {
        timeout: 15000,
        url: config.bamboo_server + "/browse/" + buildKey,
        headers: {
            "authorization": cbacAuth
        }
    };

    request(options, function(err, response, body) {
        if (err || !response || response.statusCode != 200) {
            var err_msg = err || "bad response from " + options.url + (response ? " - status code: " + response.statusCode : "");
            callback(err || err_msg);
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

            cache.put(cache_key, users, cache_expiration); //add to cache
            callback(null, users);
        }
    });
};
