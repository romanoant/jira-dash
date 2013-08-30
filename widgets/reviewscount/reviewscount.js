widget = {
    //runs when we receive data from the job
    onData: function(el, data) {
        if (data.title) {
            $('h2', el).text(data.title);
        }

		$('.content', el).empty();

        data.reviews.sort(function(a, b) {
        	return a.username > b.username;
        });

		data.reviews.forEach(function(user) {
			var $user = $("<div class='user'></div>");
      var $img = $("<img/>").attr("src", data.baseUrl + "/avatar/" + user.username).attr("alt", $user.username);

      $user.append($img);
			$user.append("<div class='count'>" + user.openReviews + "</div");

    	$('.content', el).append($user);
		});

		// Choose maximum font size with which all content will still fit
        var fontSize = 60;
        var $content = $('.content', el);
        var maxHeight = $(el).parent().height() - $('h2', el).outerHeight(true);
        var textHeight;
        do {
          $content.css('font-size', fontSize);
          textHeight = $content.outerHeight(true);
          fontSize = fontSize - 1;
        } while (textHeight > maxHeight && fontSize > 3);
    }
};