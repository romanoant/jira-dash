widget = {
  onError: function (el, data) {
    el.find('.open .remaining-issues').html("N/A");
    el.find('.review .remaining-issues').html("N/A");
  },

  onData: function (el, data) {
    if (data.title) {
      $('h2', el).text(data.title);
    }

    var openPlus = data.open.count == data.maxResults ? "+" : "";
    var reviewPlus = data.review.count == data.maxResults ? "+" : "";

    el.find('.open .remaining-issues').html("<a href='" + data.open.url + "'>" + data.open.count + openPlus + "</a>");
    el.find('.review .remaining-issues').html("<a href='" + data.review.url + "'>" + data.review.count + reviewPlus + "</a>");

    $(".open-text", el).text(data.openText);
    $(".review-text", el).text(data.reviewText);
  }
};