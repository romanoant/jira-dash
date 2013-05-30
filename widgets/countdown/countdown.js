widget = {
  onData: function(el, data) {
    $('.content', el).empty();
    $('.content', el).append("<div><span class='detail'>" + data.when + "</span>, <span class='detail'>" + data.milestone + "</span></div>");
  }
};