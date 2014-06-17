widget = (function() {
  var fontSize = 35;

  return {
    onData: function(el, data) {
      if (data.title) {
        $('h2', el).text(data.title);
      }

      var $content = $('.content', el);

      // work out how who to display and what size avatar to use
      var displayEntries = _.sortBy(_.filter(data.users, shouldDisplayEntry), "PR").reverse();
      var entrySize = Math.floor($content.innerHeight() / Math.sqrt(displayEntries.length) - fontSize);

      // add these all at once so the browser can render it all in one go
      $content.empty().append(_.reduce(displayEntries, function($avatars, entry) {
        $avatars.append(
          $('<div class=user></div>')
            .append(renderUserHtml(entry.user, { size: entrySize }))
            .append('<span class=number>' + entry.PR + '</span>')
        );

        return $avatars;
      }, $('<div class="avatar-container">'))); // <- append avatars into this

      // optionally filters out entries with 0 PRs
      function shouldDisplayEntry(e) {
        return !(data.showZeroCounts === false) || !!e.PR;
      }
    }
  };

  /**
   * Renders HTML for a single user.
   *
   * @param {object} user the user to render
   * @param {object} user.email user email
   * @param {object} [user.display] optional display name
   * @param {object} opts rendering options
   * @param {number} opts.size avatar size in pixels
   * @returns {*} a jQuery element or a string
   */
  function renderUserHtml(user, opts) {
    var displayName = user.display || user.email || user.username;
    if (user.email) {
      var src = 'https://seccdn.libravatar.org/avatar/' + md5(user.email) + '?d=identicon&s=' + opts.size;
      return $("<img>")
        .attr('alt', displayName)
        .attr('title', displayName)
        .attr('class', 'avatar')
        .attr('src', src);
    }

    return '<span class=name>' + displayName + '</span>';
  }
})();
