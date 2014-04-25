widget = {

  // runs when we receive data from the job
  onData: function (el, data) {

    var defaultSplashDuration = 5000; // or provide a alarmData.splashDuration for that specific alarm

    var fadeParams = { duration: 3000, easing: 'linear' };

    if (data.title){
      $('.widget-title', el).show().text(data.title);
    }
    else {
      $('.widget-title', el).hide(); // alarm widget looks (and works) better without a title
    }

    if (data.alarm) {
      startAlarm(data.alarm);
    }
    
    function startAlarm(alarmData) {
      var alarmPanel = $('<div class="alarm-panel"></div>').prependTo('body');
      
      // we need to define CSS here since the CSS file is scoped inside the widget selector and the alarm-panel
      // lives as a direct body child 
      alarmPanel.css('background-color', '#333333');
      alarmPanel.css('color', 'white');
      alarmPanel.css('border-radius', '10px');

      alarmPanel.css('position', 'absolute');
      alarmPanel.css('padding', '40px');
      alarmPanel.css('z-index', '9999');
      alarmPanel.css('font-size', '120px');
      alarmPanel.css('text-align', 'center');

      alarmPanel.css('left', '10%');
      alarmPanel.css('width', '80%');

      alarmPanel.css('top', '10%');
      alarmPanel.css('height', '80%');
      
      alarmPanel.append('<span class="alarm-text"></span>');

      $(alarmPanel).html(alarmData.title);

      setTimeout(function(){
        $(alarmPanel).fadeOut();
      }, alarmData.splashDuration ? alarmData.splashDuration * 1000 : defaultSplashDuration);

    }

    var prefixZero = function (val) {
      return (val < 10 ? '0' : '') + val;
    };

    function clockSeparatorAnimation() {
        $('.clock-time-separator', el).animate({
            opacity: 0.5
        }, 'fast', 'swing').animate({
            opacity: 0.6
        }, 'fast', 'swing');
    }

    function tick() {
      var now = new Date();

      var dateStr = prefixZero(now.getDate()) +
        '-' + prefixZero(now.getMonth() + 1) +
        '-' + now.getFullYear();

      $('.clock-container', el).html(
          '<div class="clock-time">' + prefixZero(now.getHours()) + '<span class="clock-time-separator">:</span>' + prefixZero(now.getMinutes()) + '</div>' +
          '<div class="clock-date">' + dateStr + '</div>'
      );

      clockSeparatorAnimation();
    }

    if (!this.registered){
      setInterval(tick, 1000);
      this.registered = true;
      tick();
    }

  }
};