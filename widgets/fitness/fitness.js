(function(exports) {

    function renderTemplate(data) {
        // render template in handlebar style
        var template = $("#fitness-template").html();
        template = _.template(template, {
            media: data.mediaId,
            width: 250,
            height: 230
        }, {
            interpolate : /\{\{(.+?)\}\}/g
        });

        return template;
    }

    function showTeaser($teaser, title) {
        $teaser.text(title).show();

        // blink teaser
        var teaserBlinkId = setInterval(function() {
            if ($teaser.is(":visible")) {
                $teaser.hide();
            } else {
                $teaser.show();
            }
        }, 500);

        // returns a function to hide the teaser
        return function() {
            clearInterval(teaserBlinkId);
            $teaser.hide();
        }
    }

    function onData(el, data) {
        var $title = $('h2', el);
        var $image = $('.image', el);
        var $teaser = $('.teaser', el);
        var $content = $('.content', el);
        var $audioContainer = $(".audio-container", el);

        if (data.ready) {
            // just bootstrap widget
            $title.text(data.widgetTitle);
            $image.removeClass("hidden");
            return;
        }

        // show teaser
        var hideTeaser = showTeaser($teaser, data.title);        
        $image.hide();

        // set audio and play
        $audioContainer.html("<audio autoplay src='" + data.speech + "'></audio>");

        // show video after a few seconds
        if (data.mediaId) {
            setTimeout(function() {
                $title.hide();
                hideTeaser();

                $content.html(renderTemplate(data));
            }, 6 * 1000);
        }

        var restoreUi = function() {
            $title.show();
            $image.show();
            $content.empty();
            hideTeaser();
        };

        // remove video with ESC
        $(document).on('keydown.fitness', function(e) {
            if (e.which === 27) {
                restoreUi();
            }
        });

        // hide video after duration
        setTimeout(restoreUi, data.duration);
    }

    exports.onData = onData;
    return exports;
})(widget = {});
