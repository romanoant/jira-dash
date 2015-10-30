module.exports = {

  buildHistogramQuery: function (query, groupBy) {

    return {
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
    }
  }
};