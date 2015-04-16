widget = {
    onData: function(el, data) {
        if (data.title) {
            $('h2', el).text(data.title);
        }

        if (data.description) {
            $('.content', el).text(data.description);
        }
    }
};