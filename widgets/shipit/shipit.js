widget = {
  onData: function(el, data) {
    $('div.when', el).html("<div><span class='detail'>" + data.when + "</span>, <span class='detail'>" + data.milestone + "</span></div>");
  }
};