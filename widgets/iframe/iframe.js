widget = {
  onData: function (el, data) {
    if (data.title) {
      $('h2', el).text(data.title);
    }
    $(el).find('.content iframe').attr('src', data.url);
  }
};