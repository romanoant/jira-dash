module.exports = {

  buildHistogramQuery: function (query, groupBy, options) {

    options = options || {};

    var query = {
      "query": query,
      "aggs": {
        "results": {
          "date_histogram": {
            "field": "@timestamp",
            "interval": groupBy
          }
        }
      },
      "size": 0
    };

    if (options.time_zone) {
      query.aggs.results.date_histogram.time_zone = options.time_zone;
    }

    return query;
  }
};