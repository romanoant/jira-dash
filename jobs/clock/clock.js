module.exports = function (config, dependencies, job_callback) {
	var isStfu = function (date, data) {
		var time = date.getHours() * 100 + date.getMinutes();
		for (var i = 0; i < data.length; i++) {
			var stfuPeriod = data[i];
			if (stfuPeriod.start <= time && stfuPeriod.end >= time) {
				return true;
			}
		}
		return false;
	}

	var prefixZero = function (val) {
		return (val < 10 ? '0' : '') + val;
	};

	var actDate = new Date();

	if (!config.stfuOnly) {
		var dateStr = prefixZero(actDate.getDate())
			+ '-' + prefixZero(actDate.getMonth())
			+ '-' + actDate.getFullYear();	

		var dataObj = {
			isStfu: isStfu(actDate, config.stfuHours),
			hour: prefixZero(actDate.getHours()),
			minutes: prefixZero(actDate.getMinutes()),
			dateStr: dateStr
		};
	} else {
		var dataObj = {
			isStfu: isStfu(actDate, config.stfuHours)
		};	
	}

	job_callback(null, dataObj);
};
