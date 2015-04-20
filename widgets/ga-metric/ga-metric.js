widget = {
    onData: function(el, result) {

        function getFirstProperty(obj){
            for (var i in obj) {
                if (obj.hasOwnProperty(i) && typeof(i) !== 'function') {
                    return obj[i];
                }
            }
            return null;
        }

        if (result.title) {
            $('h2', el).text(result.title);
        }

        var data = result.data;
        if (data.totalsForAllResults){
            var firstValue = getFirstProperty(data.totalsForAllResults);
            if (firstValue) {
                $('.content .metric', el).html(firstValue);
            }
        }
    }
};