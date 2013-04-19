var CronJob = require("cron").CronJob;
var _ = require("underscore");
var async = require("async");
var request = require("request");

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
		getSpeech(activity, data.mediaId, function(err, speech) {
			data.speech = speech;
			if (dependencies.hipchat && activity.hipchat){
				dependencies.hipchat.message(activity.hipchat.roomId, activity.hipchat.from,
						activity.hipchat.message, 1, function(err, data){
							setTimeout(function(){
								//give us 1 minute before start the music!
								job_callback(err, data);
							}, 60 * 1000);
						});
			}
		});
	}
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
	return array[_.random(array.length - 1)];
}

var speechCache = {};
/**
 * Gets the speech data for the activity's annoucement and media id. Uses a cache to store the speech data once
 * fetched from the APIs.
 */
function getSpeech(activity, mediaId, callback) {
	var speech = speechCache[activity.announcement + mediaId];
	if (speech) {
		callback(null, speech);
	} else {
		requestSpeechData(mediaId, activity.announcement, function(err, result) {
			speechCache[activity.announcement + mediaId] = result;

			callback(err, result);
		});
	}
}

/**
 * Gets the base64 data for a spoken audio track of the media's title. First we fetch the media title from
 * youtube and then use Google's TTS api to get the audio track of that title.
 */
function requestSpeechData(mediaId, announcement, callback) {
	function getTitle(callback) {
		var url = "http://gdata.youtube.com/feeds/api/videos/" + mediaId + "?v=2&alt=jsonc";
		console.log("fetching title for:", url);
		request({uri: url, json: true}, 
			function(err, response, body) {
				if (!err) {
					var title = body.data.title;
					console.log("fetched title:", title)
				}

				callback(err, title);
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
		console.log("fetching speech for:", speech)
		request({
			uri: "http://translate.google.com/translate_tts?tl=en&q=" + speech,
			encoding: "binary"
		}, function(err, response, body) {
			console.log("fetched speech", "error", err);
			// convert to base64
			var dataUriPrefix = "data:" + response.headers["content-type"] + ";base64,";
			var audio = new Buffer(body.toString(), "binary").toString("base64")
	        audio = dataUriPrefix + audio;

	        callback(err, audio)
		})
	}

	// get data in serial
	async.waterfall([getTitle, getTTS], callback);
}