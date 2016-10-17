var getBranchStatus = require('./getBranchStatus');

function mergeBranchStatusIntoExistingResults(branchInfos, branchName, statusInfo) {
    for (var i = 0; i < branchInfos.length; i++) {
        var b = branchInfos[i];
        if (b.branchName === branchName) {
            // If node 0.10 had Object.assign, we could use:
            // Object.assign(b, statusInfo);
            for (var key in statusInfo) {
                if (statusInfo.hasOwnProperty(key)) {
                    b[key] = statusInfo[key];
                }
            }

            break;
        }
    }
}

module.exports = function getBranchBuildStatus(jobWorker, branchInfos, config, branchName) {
    getBranchStatus(config, branchName).then(function(statusInfo) {
        mergeBranchStatusIntoExistingResults(branchInfos, branchName, statusInfo);
        jobWorker.pushUpdate({
            title: config.title,
            branchStatuses: branchInfos,
        });
    }).catch(function(e) { console.log(e); });
}
