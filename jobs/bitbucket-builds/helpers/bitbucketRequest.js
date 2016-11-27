var request = require('request');

module.exports = function bitbucketRequest(opts, callback) {
  var globalAuth = opts.config.globalAuth;
  var credentials = opts.config.credentials;
  var user = globalAuth[credentials].username;
  var pass = globalAuth[credentials].password;
  if (!user || !pass) return callback(new Error('Bitbucket username and/or password not provided'));

  var requester = opts.request || request;
  requester({
    url: 'https://api.bitbucket.org' + opts.endpoint,
    json: true,
    auth: {
      user: user,
      pass: pass,
      sendImmediately: true,
    },
  }, callback);
};
