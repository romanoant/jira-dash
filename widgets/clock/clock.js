widget = {
	//runs when we receive data from the job
	onData: function (el, data) {
		var isStfuCheck = function (date, data) {
			var time = date.getHours() * 100 + date.getMinutes();
			for (var i = 0; i < data.length; i++) {
				var stfuPeriod = data[i];
				if (stfuPeriod.start <= time && stfuPeriod.end >= time) {
					return true;
				}
			}
			return false;
		}
		
		var actDate = new Date(data.utc);
		var isStfu = isStfuCheck(actDate, (data.stfuOnly && data.stfuHours) || {});
		var fadeParams = {duration: 3000, easing: 'linear'};
		var prefixZero = function (val) {
			return (val < 10 ? '0' : '') + val;
		};

		var dateStr = prefixZero(actDate.getDate())
			+ '-' + prefixZero(actDate.getMonth() + 1)
			+ '-' + actDate.getFullYear();
			hour =  prefixZero(actDate.getHours());
			minutes = prefixZero(actDate.getMinutes());

		function startStfu() {
			
			$('.stfu-off').fadeOut(fadeParams);
			$('.stfu-on').fadeIn(fadeParams);
		}

		function stopStfu() {
			$('.stfu-on').fadeOut(fadeParams);
			$('.stfu-off').fadeIn(fadeParams);
		}

		function refreshDate() {
			var colon = '<span class="time-colon">:</span>';
			$('.content', el).html(
					'<div class="clock-time">' + hour + colon + minutes + '</div>'
							+ '<div class="clock-date"><br>'
							+ dateStr
							+ '</div>'
			);	
			if (isStfu) {
				startStfu();
			} else {
				stopStfu();
			}

			if (!data.stfuEnabled) {
				$('.stfu').hide()
				$('.content').addClass('center');	
			}
		}

		refreshDate();

		if (widget.prevInterval !== undefined){
			clearInterval(widget.prevInterval);
		}

		widget.prevInterval = setInterval(refreshDate, 1000);
	},
	onError: function (el, data) {
		var $error = $('<div class="container"><img src="images/warning.png"></div>');
		$error.append($('<div class="error_message content"></span>').text(data.error));
		$('.error', el).empty().append($error);
	}
};