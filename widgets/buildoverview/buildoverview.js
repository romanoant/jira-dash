widget = {

  onData: function(el, data) {

    //change the widget title if custom data is sent
    if (data.title) {
      $('.widget-title', el).text(data.title);
    }

    function buildResponsible(build) {
      var assigneeCount = 0;
      var responsiblesDiv = $("<div/>").addClass("responsibles");
      build.responsible.forEach(function (resp) {
        if (resp.avatar) {
          assigneeCount++;
          $(responsiblesDiv).append($("<img/>").attr({
            'src': resp.avatar,
            'title': resp.name
          }));
        }
      });
      return {assigneeCount: assigneeCount, responsiblesDiv: responsiblesDiv};
    }

    function createBuildEntry(build) {
      var buildDiv = $("<div/>").addClass('build').addClass("build-status").addClass(build.success);
      if (build.progress) {
        $(buildDiv).prepend($('<div class="build-progress"></div>').width(build.progress));
      }

      var buildInfo = $("<div/>").addClass('build-info');
      if (build.down) {
        buildInfo.append($("<div/>").addClass("plan-name").addClass("down").text(build.planName + " could not be accessed"));
      } else {
        buildInfo.append($("<div/>").addClass("plan-name").append($('<a/>').attr('href', build.link).text(build.planName)));

        if (build.success === 'failed') {
          var failDetails = $("<div/>").addClass("fail-details");
          var failedTests = (build.failedTestCount > 0) ? build.failedTestCount : '?';
          failDetails.append($('<span/>').addClass('failed-tests-summary').text(failedTests));
          buildInfo.append(failDetails);
        }

        if (build.isRefreshing) {
          var timeRemainingInfo = $('<span/>').addClass('time-remaining');
          var timeRemaining = build.timeRemaining || '';
          if (timeRemaining.indexOf('slower than usual') > 0) {
            timeRemaining = '- ' + timeRemaining.replace('slower than usual', '');
            timeRemainingInfo.addClass('slower-than-usual');
          }
          timeRemainingInfo.text(timeRemaining);

          buildInfo.append(timeRemainingInfo);
        }

        if (build.success === "failed") {
          var responsible = buildResponsible(build);
          if (responsible.assigneeCount != 1) {
            buildDiv.addClass("unassigned");
          }

          if (data.showResponsibles !== false){
            $(buildInfo).append(responsible.responsiblesDiv);
          }
          
        }
      }

      buildDiv.append(buildInfo);
      return buildDiv;
    }

    //build overview
    var $always_show_builds = $('.build-overview-always-show', el);
    $always_show_builds.empty();

    var totalFailedBuilds = 0;
    var totalDownBuilds = 0;
    var totalSuccessfulBuilds = 0;

    data.showBuilds.forEach(function(build) {
      if (build.down) {
        totalDownBuilds++;
      }
      else if (build.success === "failed") {
        totalFailedBuilds++;
      }
      else {
        totalSuccessfulBuilds++;
      }
      $always_show_builds.append(createBuildEntry(build));
    });

    data.showBuilds.length ? $always_show_builds.show() : $always_show_builds.hide();

    
    //build breakers
    $('.build-breakers', el).empty();

    data.failBuilds.forEach(function(build) {
      var isCurrentBuild = function (b) {
        return b.planName === build.planName;
      };

      if (build.down) {
        if (!_.find(data.showBuilds, isCurrentBuild)){
          totalDownBuilds++;
        }
      }
      else if (build.success === "failed") {
        if (!_.find(data.showBuilds, isCurrentBuild)) {
          totalFailedBuilds++;
        }
        $('.build-breakers', el).append(createBuildEntry(build));
      }
      else {
        if (!_.find(data.showBuilds, function(b){ return b.planName === build.planName ;})){
          totalSuccessfulBuilds++;
        }
      }
    });

    var totalBuilds = _.uniq(data.failBuilds.concat(data.showBuilds), false, function(build){ return build.planKey; }).length;
    var allDown = (totalBuilds === totalDownBuilds);

    // % bar
    var percentage_failed = parseInt((totalFailedBuilds / totalBuilds) * 100, 10);
    if (allDown){
      percentage_failed = 100;
    }
    $('.fail-bar', el).width(percentage_failed + "%");

    // big message for special cases
    if (allDown){
      $('.build-breakers', el).append($("<div/>").addClass("all-builds-down-message uppercase").append("ALL BAMBOO PLANS ARE DOWN"));
    }
    else if (totalFailedBuilds === 0) {
      $('.build-breakers', el).append($("<div/>").addClass("no-broken-builds-message uppercase").append("NO BROKEN BUILDS"));
    }

    // set text
    var bar_text = "";
    if (totalFailedBuilds > 0){
      bar_text = totalFailedBuilds + '/'+ totalBuilds + ' RED';
    }
    else{
      bar_text = (totalBuilds - totalDownBuilds) + ' BUILDS GREEN';
    }
    if (totalDownBuilds > 0){
      bar_text += ' (' + totalDownBuilds + ' DOWN)';
    }
    $('.failed-report', el).html(bar_text);

    $('.content', el).removeClass('hidden').addClass('show');
    $('.spinner', el).remove();
  }
};

