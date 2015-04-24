widget = {
    onData: function(el, result) {

        if (result.title) {
            $('h2', el).text(result.title);
        }
        var data = result.data;
        var config = result.safeConfig;

        if (config.captions) { // custom header captions
            for (var i = 0; i < config.captions.length; i++) {
                data.columnHeaders[i].name = config.captions[i];
            }
        }
        data.rows = data.rows || []; // ga send empty rows if no data
        var template = _.template($('.template', el).html());
        $('.content', el).html(template(data));
    }
};