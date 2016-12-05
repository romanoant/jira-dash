/**
 * Test file for Job: pipelines-builds
 */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var assert = chai.assert;
var getBranchList = require('../helpers/getBranchList');

describe('bitbucket-builds tests', function() {

  describe ('getBranchList()', function() {
    var bbRequestMock = function(opts, callback) {
      callback(null, null, require('./stubs/branch-list'))
    }

    it('should resolve with array of branch objects sorted by utctimestamp', function () {
      return assert.eventually.deepEqual(getBranchList({ bbRequest: bbRequestMock }), [
        {
          "branchName": "bayers/typescript-bump-lerna",
          "isImportant": false,
          "status": "unknown",
        },
        {
          "branchName": "remove-ds-store-files",
          "isImportant": false,
          "status": "unknown",
        },
        {
          "branchName": "another-random-branch",
          "isImportant": false,
          "status": "unknown",
        },
      ]);
    });

    it('should accept importantBranches flag', function () {
      return assert.eventually.deepEqual(getBranchList({
        bbRequest: bbRequestMock,
        importantBranches: ['remove-ds-store-files'],
      }), [
        {
          "branchName": "bayers/typescript-bump-lerna",
          "isImportant": false,
          "status": "unknown",
        },
        {
          "branchName": "remove-ds-store-files",
          "isImportant": true,
          "status": "unknown",
        },
        {
          "branchName": "another-random-branch",
          "isImportant": false,
          "status": "unknown",
        },
      ]);
    });

    it('should restrict result length based on branchCount flag', function () {
      return assert.eventually.deepEqual(getBranchList({
        bbRequest: bbRequestMock,
        branchCount: 2,
      }), [
        {
          "branchName": "bayers/typescript-bump-lerna",
          "isImportant": false,
          "status": "unknown",
        },
        {
          "branchName": "remove-ds-store-files",
          "isImportant": false,
          "status": "unknown",
        },
      ]);
    });
  });

});
