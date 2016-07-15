widget = {
  onData: function (el, data) {
    if (data.title) {
      $('h2', el).text(data.title);
    }
    
    var image = $(el).find('.content img');
    image.attr('width', data.width);
    image.attr('height', data.height);
    image.attr('src', data.graphUrl);
  }
};