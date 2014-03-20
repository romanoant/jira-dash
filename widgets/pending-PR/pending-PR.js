widget = {
  
  onData: function(el, data) {

    function getAvatarImg(name, email) {
      return $("<img alt = '" + name + "' title='" + name +
        "' class='avatar' src='http://www.gravatar.com/avatar/" + md5(email) + "'/>");
    }

    if (data.title) {
      $('h2', el).text(data.title);
    }

    $('.content', el).empty();

    for (var i = 0; i < data.users.length; i++) {
      var entry = data.users[i];
      var user = entry.user;
      var $container = $('<div class=user></div>');

      if (user.email){
        $container.append(getAvatarImg(user.display, user.email));
      }
      else {
        $container.append('<span class=name>' + user.display + '</span>');
      }

      $container.append('<span class=number>' + entry.PR + '</span>');
      $('.content', el).append($container);
    }
  }
};