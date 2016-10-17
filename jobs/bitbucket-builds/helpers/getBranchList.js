var Q = require('q');
var bbRequest = require('./bitbucketRequest');
var _ = require('lodash');
var statusConstants = require('./statusConstants');

module.exports = function getBranchList(config) {
    return Q.Promise(function(resolve) {
        var importantBranches = config.importantBranches || ['master'];

        bbRequest({
            endpoint: '/1.0/repositories/' + config.repo + '/branches',
            config: config,
        }, function (err, response, branchListBody) {
            var branchCount = config.branchCount || 10;

            // Move the branchName (key) into the object so we can later convert to array for sorting
            var branchesWithBranchAsValue = _.mapValues(branchListBody, function(branchObj, branchName) {
                branchObj.branchName = branchName;
                return branchObj;
            });

            var sortedBranches = _.sortBy(
                _.values(branchesWithBranchAsValue), 'utctimestamp'
            ).reverse().slice(0, branchCount);

            // Sort the list of branches
            var branchInfos = sortedBranches.map(function(branchInfo) {
                return {
                    branchName: branchInfo.branchName,
                    isImportant: importantBranches.indexOf(branchInfo.branchName) >= 0,
                    status: statusConstants.UNKNOWN,
                };
            });

            resolve(branchInfos);
        });
    });
};
