widget = {

    onData: function(el, data) {
        //change the widget title if custom data is sent
        if (data.title) {
            $('.widget-title', el).text(data.title);
        }

        //build overview
        $('.build-overview-always-show', el).empty();

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
            var buildDiv = $("<div/>").addClass("build-status").addClass(build.success);
            if (build.down) {
                buildDiv.append($("<div/>").addClass("plan-name").addClass("down").append(build.planName + " could not be accessed on CBAC"));
            } else {
                buildDiv.append($("<div/>").addClass("plan-name").append("<a href='" + build.link + "'>" + (build.isRefreshing ? build.planName + " [R]" : build.planName) + "</a>"));
            }
            $('.build-overview-always-show', el).append(buildDiv);
        });


        //build breakers
        $('.build-breakers', el).empty();

        data.failBuilds.forEach(function(build) {
            if (build.down) {
                if (!_.find(data.showBuilds, function(b){ return b.planName === build.planName ;})){
                    totalDownBuilds++;
                }
            }
            else if (build.success === "failed") {
                if (!_.find(data.showBuilds, function(b){ return b.planName === build.planName ;})){
                    totalFailedBuilds++;
                }

                var buildDiv = $("<div/>").addClass("build");
                buildDiv.append($("<div/>").addClass("plan-name").append("<a href='" + build.link + "'>" + (build.isRefreshing ? build.planName + " [R]" : build.planName) + "</a>"));

                var assigneeCount = 0;
                var responsiblesDiv = $("<div/>").addClass("responsibles");
                build.responsible.forEach(function(resp) {
                    if (resp.avatar) {
                        assigneeCount ++;
                        $(responsiblesDiv).append($("<img/>").attr({
                            'src' : resp.avatar,
                            'title' : resp.name
                        }));
                    }
                });

                if (assigneeCount != 1) {
                    // Show build as red if there's multiple or zero assignees.
                    buildDiv.addClass("unassigned");
                }

                $(buildDiv).append(responsiblesDiv);

                $('.build-breakers', el).append(buildDiv);
            }
            else {
                if (!_.find(data.showBuilds, function(b){ return b.planName === build.planName ;})){
                    totalSuccessfulBuilds++;
                }
            }
        });

        if (totalFailedBuilds === 0) {
            $('.build-breakers', el).append($("<div/>").addClass("no-broken-builds-message uppercase").append("NO BROKEN BUILDS"));
        }

        var totalBuilds = _.uniq(data.failBuilds.concat(data.showBuilds), false, function(build){ return build.planKey; }).length;

        var percentage_failed = parseInt((totalFailedBuilds / totalBuilds) * 100, 10);
        $('.fail-bar', el).width(percentage_failed + "%");

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
