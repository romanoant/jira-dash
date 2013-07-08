var CronJob = require("cron").CronJob;
var _ = require("underscore");
var async = require("async");

var DEFAULTS = {
	duration: 3 * 60 * 1000,
	enabled: true,
	announcement: "Work out time! Music by {0}"
};

module.exports = function(config, dependencies, job_callback) {
	if (!this.jobs) {
		this.jobs = createCronJobs(config, dependencies, job_callback);
	}

	// tell client we are ready
	job_callback(null, {ready: true, widgetTitle: config.widgetTitle});
};

/**
 * Creates cron jobs for all enabled activities.
 * 
 * Returns an object with the activity names as key and the cron job as properties.
 */
function createCronJobs(config, dependencies, job_callback) {
	dependencies.logger.log("Initializing fitness widget with  " + config.media.length + " songs");

	var activities = config.activities;

	// default options
	activities = _.map(activities, function(activity) {
		return _.extend({}, DEFAULTS, activity);
	});

	// reject disabled activities
	activities = _.where(activities, {enabled: true});

	return activities.reduce(function(memo, activity) {
		var cronHandler = makeCronHandler(activity, config, dependencies, job_callback);
		memo[activity.name] = newCron(activity.cron, cronHandler);
		return memo;
	}, {});
}

/**
 * Creates a function that calls the job_callback with all the data the client needs for this activity.
 */
function makeCronHandler(activity, config, dependencies, job_callback) {
	return function () {
		var data = {
			widgetTitle: config.widgetTitle,
			title: activity.title,
			mediaId: pickRandom(config.media),
			duration: activity.duration
		};
		getSpeech(activity, data.mediaId, config, dependencies, function(err, speech) {
			data.speech = speech;

			if (dependencies.hipchat && activity.hipchat){
				dependencies.hipchat.message(activity.hipchat.roomId, activity.hipchat.from,
						activity.hipchat.message, 1, function(err, statusCode){
							if (err){ return job_callback(err); }
							setTimeout(function(){
								//give us some time before the music starts!
								job_callback(err, data);
							}, 20 * 1000);
						});
			}
			else{
				job_callback(err, data);
			}
		});
	};
}

function newCron(cronTime, cronHandler) {
	var job = new CronJob({
		cronTime: cronTime,
		onTick: cronHandler,
		start: true
	});

	return job;
}

function pickRandom(array) {
    if (!array || array.length === 0) {
        return null;
    }
	return array[_.random(array.length - 1)];
}

var speechCache = {};
/**
 * Gets the speech data for the activity's annoucement and media id. Uses a cache to store the speech data once
 * fetched from the APIs.
 */
function getSpeech(activity, mediaId, config, dependencies,callback) {
	var speech = speechCache[activity.announcement + mediaId];
	if (speech) {
		callback(null, speech);
	} else {
		requestSpeechData(mediaId, activity.announcement, config, dependencies, function(err, result) {
			speechCache[activity.announcement + mediaId] = result;

			callback(err, result);
		});
	}
}

/**
 * Gets the base64 data for a spoken audio track of the media's title. First we fetch the media title from
 * youtube and then use Google's TTS api to get the audio track of that title.
 */
function requestSpeechData(mediaId, announcement, config, dependencies, callback) {
	function getTitle(callback) {
        if (!mediaId) {
            return callback(null, "");
        }

		var url = "http://gdata.youtube.com/feeds/api/videos/" + mediaId + "?v=2&alt=jsonc";
		dependencies.logger.log("fetching title for:" + url);
		dependencies.request({uri: url, json: true},
			function(err, response, body) {
				if (err) {
					dependencies.logger.error(err);
					return callback(err);
				}
				else{
					var title = body.data.title;
					dependencies.logger.log("fetched title:", title);
					return callback(null, title);
				}
			});
	}

	function formatSpeech(announcement, title) {
		var speech = announcement.replace("{0}", title);

		// remove stuff in (parens) or [brackets]
		speech = speech.replace(/[\[\(].*?[\]\)]/g, "");
		speech = speech.trim();

		return speech;
	}

	function getTTS(title, callback) {
		var speech = formatSpeech(announcement, title);
		dependencies.logger.log("fetching speech for:" + speech);
		dependencies.request({
			uri: "http://translate.google.com/translate_tts?tl=en&q=" + speech,
			encoding: "binary"
		}, function(err, response, body) {
			if (err){
				dependencies.logger.error(err);
				return callback(err);
			}
			else {
				// convert to base64
				var dataUriPrefix = "data:" + response.headers["content-type"] + ";base64,";
				var audio = new Buffer(body.toString(), "binary").toString("base64");
				audio = dataUriPrefix + audio;

				callback(null, audio);
			}
		});
	}

	// get data in serial
	async.waterfall([getTitle, getTTS], callback);
}
