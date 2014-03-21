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

    $('h2', el).html("<a href='" + data.blockersLink + "'>" + data.blockers.length + " BLOCKER(S)</a>");

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

        if (blocker.blocking && blocker.blocking.length){
           blocker.summary = "<span class=issue-blocking>" + blocker.blocking.join(', ') + "</span>" + blocker.summary;
        }

        listItem.append($("<div/>").addClass("issue-summary").append(blocker.summary));
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