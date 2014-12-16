widget = {

    //runs when we receive data from the job
    onData: function(el, data) {
      if (data.title) {
        $('h2', el).text(data.title);
      }

      $('.content', el).empty();

      data.sections.forEach(function(section) {
        if (section.title) {
          $('.content', el).append($("<h2>" + section.title + "</h2>"));
        }

        section.counts.sort(function(a, b) {
          return b.count - a.count;
        });

        var $counts = $("<div class='counts'></div>");
        $('.content', el).append($counts);

        section.counts.forEach(function(data) {
          
          var result = "";

          if (data.error) {
            result = "<span class=error>ERR</span>";
          }
          else {
            result = (data.count > 200) ? "200+" : data.count;          
          }

          var $result = $("<div class='result'><a href=\"" + data.url + "\">" + result + "</a></div>");
          var $label = $("<div class='label'><a href=\"" + data.url + "\">" + data.label + "</a></div>");

          if (data.count > 0) {
            $result.addClass("pending");
          }
          
          var $count = $("<div class='count'></div>");
          $count.append($result);
          $count.append($label);
          $counts.append($count);

        });
      });
    }
};