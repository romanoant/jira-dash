widget = {
    //runs when when data is returned by the Sprint Health job
    onData: function(el, data) {
    	var template = _.template($('.template', el).html());

        if (data.title) {
            $('h2', el).text(data.title);
        }

        $('.content', el).html(template(data));
    }
};