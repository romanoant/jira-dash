/**
 * Job: bitbucket-builds
 *
 * Expected configuration:
 *
 * {
 *   "credentials": "bitbucket",
 *   "interval": 60000,
 *   "repo": "username/repo",
 *   "branchCount": 12,
 *   "showCulprits": true,
 *   "importantBranches": ["master"]
 * }
 */

var getBranchList = require('./helpers/getBranchList');
var getBranchBuildStatus = require('./helpers/getBranchBuildStatus');

module.exports = {

    /**
    * Executed every interval
    * @param config
    * @param dependencies
    * @param jobCallback
    */
    onRun: function (config, dependencies, jobCallback) {
        var jobWorker = this;

        // Ensure username + password supplied
        var credentialsKey = config.credentials;
        if (!config.globalAuth || !config.globalAuth[credentialsKey] || !config.globalAuth[credentialsKey].username || !config.globalAuth[credentialsKey].password) {
            return jobCallback('No Bitbucket credentials found for pipelines-builds job. Please check global authentication file.');
        }

        getBranchList(config).then(function(branchInfos) {
            // Load statuses for each branch and push back to the client live
            branchInfos.forEach(function(branchInfo) {
                getBranchBuildStatus(jobWorker, branchInfos, config, branchInfo.branchName);
            });

            // Send the branch list back to the client (without statuses)
            jobCallback(null, {
                title: config.title,
                branchStatuses: branchInfos,
            });
        });
    },
};
