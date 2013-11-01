widget = {
	//runs when we receive data from the job
	onData: function (el, data) {
		var fadeParams = {duration: 3000, easing: 'linear'};

		function startStfu() {
			$('.stfu-off').fadeOut(fadeParams);
			$('.stfu-on').fadeIn(fadeParams);
		}

		function stopStfu() {
			$('.stfu-on').fadeOut(fadeParams);
			$('.stfu-off').fadeIn(fadeParams);
		}

		function refreshDate() {
			if (data.hour !== undefined && data !== undefined) {
				var d = new Date();
				var colonClass = 'time-colon time-colon-' + (d.getSeconds() % 2);
				var colon = '<span class="' + colonClass + '">:</span>';
				$('.content', el).html(
						'<div class="clock-time">' + data.hour + colon + data.minutes + '</div>'
								+ '<div class="clock-date"><br>'
								+ data.dateStr
								+ '</div>'
				);	
			}
			if (data.isStfu) {
				startStfu();
			} else {
				stopStfu();
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