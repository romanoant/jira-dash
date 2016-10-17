var request = require('request');

module.exports = function bitbucketRequest(opts, callback) {
    var globalAuth = opts.config.globalAuth;
    var credentials = opts.config.credentials;
    request({
        url: 'https://api.bitbucket.org' + opts.endpoint,
        json: true,
        auth: {
            user: globalAuth[credentials].username,
            pass: globalAuth[credentials].password,
            sendImmediately: true,
        },
    }, callback);
};
