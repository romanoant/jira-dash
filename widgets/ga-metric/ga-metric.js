widget = {
    onData: function(el, result) {
        if (result.title) {
            $('h2', el).text(result.title);
        }

        var data = result.data;
        // TODO: get rid of hardcoded goal ID
        if (data.totalsForAllResults && data.totalsForAllResults["rt:goal16Completions"]){
            $('.content .metric', el).html(data.totalsForAllResults["rt:goal16Completions"]);
        }
    }
};