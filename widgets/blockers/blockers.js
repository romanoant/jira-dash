widget = {

  onData: function (el, data) {

    function getAvatar (blocker){
      if(blocker.assigneeEmail) {
        return ($("<img alt = '" + blocker.assigneeName +
          "' title='" + blocker.assigneeName +
          "' class='avatar' src='http://www.gravatar.com/avatar/" +
          md5(blocker.assigneeEmail) + "'/>"));
      } else {
        return ("<span class='avatar unknown'>?</span>");
      }
    }

    $('.blockers', el).empty();

    if (data.blockers.length){
      var blockerText = (data.blockers.length === 1) ? "BLOCKER" : "BLOCKERS";
      var severity = (data.blockers.length > 10) ? "veryhigh" : ((data.blockers.length > 5) ? "high" : "normal");
      $('h2', el).html("<a href='" + data.blockersLink + "'><span class=" + severity + ">" + data.blockers.length + "</span> " + blockerText + "</a>");
    }
    else {
      $('h2', el).html("NO BLOCKERS");
    }
    

    if (data.blockers.length > 0) {

      data.blockers.forEach(function(blocker) {
        var listItem = $("<li/>")

        listItem.append(getAvatar(blocker));

        var $issueData = $("<div class=\"issue-data\"/>");
        $issueData.append($("<strong/>").addClass("issue-key").append("<a target=_blank href='" + blocker.url + "'>" + blocker.issueKey + "</a>"));
        $issueData.append($("<strong/>").addClass("issue-owner").append(blocker.team));
        listItem.append($issueData);

        if (blocker.highlighted) {
          $('.issue-owner', listItem).addClass('highlighted');
        }

        var $summary = $("<div/>").addClass("issue-summary").append(blocker.summary).appendTo(listItem);
        if (blocker.blocking && blocker.blocking.length){
          $summary.prepend("<span class=issue-blocking>" + blocker.blocking.join(', ') + "</span>");
        }

        listItem.append($("<div/>").addClass("issue-blocking").append());

        $('.blockers', el).append(listItem);
      });

    } else {
      $('.blockers', el).append(
        "<div class='no-blockers-message'>" +
          "NO BLOCKERS FOUND" +
          "<div class='smiley-face'>" +
          "☺" +
          "</div>" +
        "</div>");
    }

    $('.content', el).show();
  }

};