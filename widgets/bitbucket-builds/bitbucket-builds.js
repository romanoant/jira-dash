widget = {
  //runs when we receive data from the job
  onData: function (el, data) {
    //The parameters our job passed through are in the data object
    //el is our widget element, so our actions should all be relative to that
    if (data.title) {
        $('h2', el).text(data.title);
    }

    if (data.branchStatuses) {
        var $ul = $('.content ul', el).empty();
        var fontSize = ($ul.height()/data.branchStatuses.length)/2;
        for (branch of data.branchStatuses) {
            var $li = $('<li>');
            $li.attr('data-branch', branch.branchName).attr('data-status', branch.status);

            if (branch.isImportant) {
                $li.addClass('important-branch');
            }

            if (branch.isInProgress) {
                $li.addClass('inprogress');
            }

            var $span = $('<span>').text(branch.branchName).css('font-size', fontSize);

            if (branch.culprit) {
                var $img = $('<img class="avatar" />').attr('src', branch.culprit);
                $span.append($img);
            }

            $li.append($span);

            $ul.append($li);
        }
    }
  }
};
