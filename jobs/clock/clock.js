module.exports = function (config, dependencies, job_callback) {
	var stfuEnabled = config.stfuHours !== undefined;
	var d = new Date();
	console.log(d.utc, "ja")
	var dataObj = {
		stfuEnabled: stfuEnabled,
		stfuOnly: config.stfuOnly,
		stfuHours: config.stfuHours,
		center: config.center,
		utc: d.toUTCString()
	};

	job_callback(null, dataObj);
};
