/**
 * Job: iframe
 *
 * Expected configuration:
 *
    "iframe-Atlasboard": {
      "title": "Atlasboard in an iframe",
      "url": "http://atlasboard.bitbucket.org/"
    }
 */

module.exports = {
  onRun: function (config, dependencies, jobCallback) {
    jobCallback(null, {title: config.title, url: config.url});
  }
};