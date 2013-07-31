widget = {
  onData: function(el, data) {
    $('.days', el).text(data.days);
    $('.title', el).text(data.title);
    $('.table', el).show();
  }
};