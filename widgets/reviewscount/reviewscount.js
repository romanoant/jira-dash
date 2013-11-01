widget = {
    //runs when we receive data from the job
    onData: function(el, data) {
        if (data.title) {
            $('h2', el).text(data.title);
        
}
		    data.reviews.sort(function(a, b) {
        	return a.username > b.username;
        });

        var firstTime = $('.content', el).children().length == 0;

    		data.reviews.forEach(function(user) {
          if (firstTime) {
            var $user = $("<div class='user'></div>");
            var $img = $("<img/>").attr("src", data.baseUrl + "/avatar/" + user.username + "?s=60&redirect=false").attr("alt", $user.username);

            $user.append($img);
            $user.append("<div class='count' data-username='" + user.username + "'></div");
            $('.content', el).append($user);
          }

          $('.content .user .count[data-username=' + user.username + ']', el).text(user.openReviews);
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