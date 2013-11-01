var async = require('async'), qs = require('querystring'), util = require('util'), _ = require('underscore');

module.exports = function(config, dependencies, job_callback) {
	var authName = config.authName || "crucible";

	if (!config.globalAuth || !config.globalAuth[authName] ||
		!config.globalAuth[authName].username || !config.globalAuth[authName].password) {
		return job_callback('no Crucible credentials found in buildoverview job. Please check global authentication file');
	}

	if (!config.crucibleUrl) {
		return job_callback("No Crucible server configured");
	}

	if (!config.teamMembers) {
		return job_callback("No team members configured");
	}

	if (!config.projects) {
		return job_callback("No projects configured");
	}

	var requestOptions = {
    	headers: {
      	"authorization": "Basic " + new Buffer(config.globalAuth[config.authName].username 
	        + ":" + config.globalAuth[config.authName].password).toString("base64")
	    }
  	};

	var logger = dependencies.logger;
	var reviewsUrl = config.crucibleUrl + '/rest-service/reviews-v1/filter.json?states=Review&';
	var userUrl = config.crucibleUrl + '/rest-service/users-v1/';

	async.map(config.teamMembers, function(teamMember, teamMemberCallback) {
		async.map(config.projects, function(project, projectCallback) {
			requestOptions.url = reviewsUrl + qs.stringify({author: teamMember, project: project});

			logger.log("Downloading reviews from " + requestOptions.url);

			dependencies.request(requestOptions, function(err, response, body) {
				if (err || !response || response.statusCode != 200) {
					var error_msg = (err || (response ? ("bad statusCode: " + response.statusCode) : "bad response")) + " from " + requestOptions.url;
					logger.error(error_msg);
					projectCallback(error_msg);
				} else {
					var filterResult;
					try {
						filterResult = JSON.parse(body);
					} catch(e) {
						logger.error("Unable to parse JSON " + e);
						return projectCallback(e);
					}
					projectCallback(null, filterResult.reviewData.length);
				}
			});
		}, function(err, reviewCounts) {
			var summary = _.reduce(reviewCounts, function(memo, num) {
				return memo + num;
			});

			teamMemberCallback(null, {
				"username": teamMember,
				"openReviews": summary
			});
		});
	}, function(err, reviewsByUser) {
		logger.log(util.inspect(reviewsByUser));
		job_callback(err, {title: config.title, baseUrl: config.crucibleUrl, reviews: reviewsByUser});
	})
};
