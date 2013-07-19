widget = {

  onData: function (el, data) {
    $('.blockers', el).empty();

    $('h2', el).html("<a href='" + data.blockersLink + "'>" + data.blockers.length + " BLOCKER(S)</a>");

    if (data.blockers.length > 0) {

      data.blockers.forEach(function(blocker) {
        var listItem = $("<li/>")
        if(blocker.assigneeEmail) {
          listItem.append($("<img alt = '" + blocker.assigneeName +
            "' title='" + blocker.assigneeName +
            "' class='avatar' src='http://www.gravatar.com/avatar/" +
            md5(blocker.assigneeEmail) + "'/>"));
        } else {
          listItem.append("<span class='avatar unknown'>?</span>");
        }

        var $issueData = $("<div class=\"issue-data\"/>");
        listItem.append($issueData);
        $issueData.append($("<strong/>").addClass("issue-key").append("<a href='" + blocker.url + "'>" + blocker.issueKey + "</a>"));
        $issueData.append($("<strong/>").addClass("issue-owner").append(blocker.team));

        listItem.append($("<div/>").addClass("issue-summary").append(blocker.summary));

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