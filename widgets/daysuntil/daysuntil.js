widget = {
  onData: function(el, data) {
    $('.content', el).empty();
    $('.content', el).append("<div><span class='detail'>" + data.days + "</span> DAYS UNTIL</div><div><span class='detail'>" + data.milestone + "</span></div>");
  }
};