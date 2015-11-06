widget = {

  onData: function ($el, data) {

    var DEFAULT_COLOURS = ["#2ecc71", "#3498db", "#9b59b6", "#f1c40f", "#e74c3c", "#bdc3c7"];

    var chartConfig = data.jobConfig.chartConfig || {};

    var format = function (d) {
      d = new Date(d);
      return d3.time.format(chartConfig.xFormatter || '%e/%m %H:%M')(d);
    };

    function paintChart(width, height, series) {
      var DEFAULT_OPTIONS = {
        element: $('.graph', $el)[0],
        width: width,
        height: height,
        renderer: 'multi',
        series: series,
        padding: {top: 0.25, left: 0.08, right: 0.02, bottom: 0.3}
      };

      var graph = new Rickshaw.Graph($.extend({}, DEFAULT_OPTIONS, chartConfig.graphOptions));

      if (chartConfig.hideAxisX !== true) {
        new Rickshaw.Graph.Axis.X({
          graph: graph,
          tickFormat: format,
          ticksTreatment: 'white-tick-treatment',
          element: $('.x_axis', $el)[0]
        }).render();
      }
      if (chartConfig.hideAxisY !== true) {
        new Rickshaw.Graph.Axis.Y({
          graph: graph,
          ticksTreatment: 'white-tick-treatment'
        }).render();
      }

      var legend = new Rickshaw.Graph.Legend({
        graph: graph,
        element: $('.legend', $el)[0]
      });

      new Rickshaw.Graph.HoverDetail({
        graph: graph,
        xFormatter: function (x) {
          return format(x);
        },
        yFormatter: function (y) {
          return Math.floor(y);
        }
      });

      graph.render();
    }

    function makeDataSeries(rawSeries) {
      var series = [];
      $.each(rawSeries, function (index, rawSerie) {
        var rows = [];
        $.each(rawSerie.data, function (i, row) {
          rows.push({
            x: row.time,
            y: row.value
          });
        });
        if (rows.length) {
          series.push({
            data: rows,
            color: rawSerie.options.color || DEFAULT_COLOURS[index],
            name: rawSerie.options.name,
            renderer: rawSerie.options.renderer || 'line'
          });
        }
      });
      return series;
    }

    var $graph = $('.graph', $el);

    if (data.jobConfig.widgetTitle){
      $('h2', $el).text(data.jobConfig.widgetTitle);
    }

    var series = makeDataSeries(data.data);

    $graph.empty();
    $('.legend', $el).empty();
    $('.x_axis', $el).empty();

    if (!series.length) {
      console.error('No dataz');
      return;
    }

    var width = $graph.width();
    var height = $el.closest('li').height() - $('h2', $el).height() - 80;

    paintChart(width, height, series);
  }
};
