const _ = require('lodash');

function createUserElement(username) {
  // would normally have links, displayName, etc
  return {
    name: username
  };
}

/**
 * Creates a PR participant.
 *
 * @param {string} username
 * @param {object} [properties] optional user properties to set on the element
 * @return {object} the participant
 */
function createParticipant(username, properties) {
  return _.extend({}, properties, {
    user: createUserElement(username)
  });
}

function createBitBucketParticipant(username) {
  return {
    role: "REVIEWER",
    user : {
      username: username
    },
    approved: false
  };
}

/**
 *
 * @param {number} number the number or PRs to create
 * @param {string} author the username of the author
 * @param {[string]|{object}} [reviewers] the usernames of reviewers or a username->properties hash
 * @return {[object]} an array of PRs
 */
function getFakeStashPR (number, author, reviewers) {
  // lift array of usernames into username->properties hash if necessary
  const reviewerProps = !_.isArray(reviewers) ? reviewers : _(reviewers || []).map(function(username) {
    return [ username, {} ];
  }).object().value();

  return _.map(_.range(number), function (i) {
    return {
      id : i,
      title: 'title' + i,
      description: 'description' + i,
      state: 'OPEN',
      author: createParticipant(author),
      reviewers: _.map(reviewerProps, function(props, username) {
        return createParticipant(username, props);
      })
    };
  });
}

function getFakeBitbucketPR (author, participants) {

  var entry = {
    id : 1,
    title: 'title',
    description: 'description',
    state: 'OPEN',
    author: createParticipant(author),
    links: {
      self: {
        href: 'https://bitbucket.org/atlassian-marketplace/atlassian-upm'
      }
    },
  };

  participants = participants || [];
  entry.participants = [];
  for (var p = 0; p < participants.length; p++) {
    entry.participants.push(createBitBucketParticipant(participants[p]));
  }

  return entry;
}

module.exports = {
  getFakeStashPR: getFakeStashPR,
  getFakeBitbucketPR: getFakeBitbucketPR
}