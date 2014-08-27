widget = (function() {
  var fontSize = 35;

  /**
   * In most cases there will be some free space within the container
   * that is not taken up by avatars. Enlarge the avatars by a few pixels
   * to take up the free space.
   */
  var ENLARGE_AVATARS_BY = 30;

  return {
    /**
     * @param el
     * @param {object} data
     * @param {object} data.widget the widget configuration
     */
    onData: function(el, data) {
      if (data.title) {
        $('h2', el).text(data.title);
      }

      var $content = $('.content', el);

      // work out how who to display and what size avatar to use
      var displayEntries = _.sortBy(_.filter(data.users, shouldDisplayEntry), "PR").reverse();
      var entrySize = $content.innerHeight() / Math.ceil(Math.sqrt(displayEntries.length)) - fontSize;

      // fix the vertical alignment once all images have loaded. this callback will only fix
      var onDisplayCallback = _.after(displayEntries.length, fixVerticalAlignment);

      // create the avatars div
      var $avatars = _.reduce(displayEntries, function ($avatars, entry) {
        $avatars.append(
          $('<div class=user></div>')
            .append(renderUserHtml(entry.user, { size: Math.floor(calculateDisplaySize(entry)) }))
            .append('<span class=number>' + entry.PR + '</span>')
        );

        return $avatars;
      }, $('<div class="avatar-container">'));

      // append the div and keep the avatars centred
      $content.empty().append($avatars);

      /**
       * Keeps <code>el</code>. This method run every second for the first 10 seconds as the height may change
       * while the browser has not finished fetching all the images.
       */
      function fixVerticalAlignment() {
        $avatars.css('margin-top', ($content.height() - $avatars.height()) / 2);
      }

      /**
       * If displayfilters out entries with 0 PRs (depending on the widget configuration).
       *
       * @param {object} entry
       * @param {number} entry.PR
       * @returns {boolean}
       */
      function shouldDisplayEntry(entry) {
        return data.widget.showZeroCounts || !!entry.PR;
      }

      /**
       * Calculates the display size to use for a given entry.
       *
       * @param {object} entry
       * @param {number} entry.PR
       * @returns {number}
       */
      function calculateDisplaySize(entry) {
        var maxPR = _.max(_.pluck(displayEntries, "PR"));
        if (!data.widget.useProportionalAvatars || !maxPR) {
          return entrySize;
        }

        var percentOfMax = entry.PR / maxPR;

        // make the display size proportional to the workload
        return entrySize * percentOfMax + ENLARGE_AVATARS_BY;
      }

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
            .attr('src', src)
            .load(onDisplayCallback);
        }

        // if not loading an image then just defer the callback invocation
        _.defer(onDisplayCallback);
        return '<span class=name>' + displayName + '</span>';
      }
    }
  };
})();

