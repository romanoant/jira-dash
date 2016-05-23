widget = {
  onData: function (el, data) {
    if (data.title) {
      $('h2', el).text(data.title);
    }
    $('.content iframe').attr('src', data.url);
  }
};