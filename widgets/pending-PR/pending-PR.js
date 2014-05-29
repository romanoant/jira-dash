widget = {

  onData: function(el, data) {

    function getAvatarImg(name, email) {
      return $("<img alt = '" + name + "' title='" + name +
        "' class='avatar' src='https://seccdn.libravatar.org/avatar/" + md5(email) + "?d=identicon'/>");
    }

    if (data.title) {
      $('h2', el).text(data.title);
    }

    $('.content', el).empty();

    for (var i = 0; i < data.users.length; i++) {
      var entry = data.users[i];
      var user = entry.user;
      var $container = $('<div class=user></div>');

      var displayName = user.display || user.email;
      if (user.email){
        $container.append(getAvatarImg(displayName, user.email));
      }
      else {
        $container.append('<span class=name>' + displayName + '</span>');
      }

      $container.append('<span class=number>' + entry.PR + '</span>');
      $('.content', el).append($container);
    }
  }
};
