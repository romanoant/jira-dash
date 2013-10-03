widget = {
    //runs when we receive data from the job
    onData: function(el, data) {
        if (data.title) {
            $('h2', el).text(data.title);
        }

        $('.content', el).empty();

        data.sections.forEach(function(section) {
          if (section.title) {
            $('.content', el).append($("<h3>" + section.title + "</h3>"));
          }

          section.counts.sort(function(a, b) {
            return a.count < b.count;
          })
          var $counts = $("<div class='counts'></div>");
          $('.content', el).append($counts);
          section.counts.forEach(function(count) {
            if (!count.count)
              return;

            var displayCount = (count.count == 200) ? "200+" : count.count;
            var $result = $("<div class='result'><a href=\"" + count.url + "\">" + displayCount + "</a></div>");
            if (count.count > 0) {
              $result.addClass("pending");
            }
            var $label = $("<div class='label'><a href=\"" + count.url + "\">" + count.label + "</a></div>");
            var $count = $("<div class='count'></div>");
            $count.append($result);
            $count.append($label);
            $counts.append($count);
          })

          if (!$counts.children().size()) {
            $counts.append("<div class='count'><span class='result'>0</span>Open Issues</div>")
          }
        })

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