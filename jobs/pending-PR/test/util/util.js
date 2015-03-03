function createUserElement(username) {
  return {
    user : {
      name: username
    }
  };
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

function getFakeStashPR (number, author, reviewers) {
  var listPRs = [];

  for (var i = 0; i < number; i++) {
    var entry = {
      id : i,
      title: 'title' + i,
      description: 'description' + i,
      state: 'OPEN',
      author: createUserElement(author)
    };

    reviewers = reviewers || [];
    entry.reviewers = [];
    for (var p = 0; p < reviewers.length; p++) {
      entry.reviewers.push(createUserElement(reviewers[p]));
    }

    listPRs.push(entry);
  }
  return listPRs;
}

function getFakeBitbucketPR (author, participants) {

  var entry = {
    id : 1,
    title: 'title',
    description: 'description',
    state: 'OPEN',
    author: createUserElement(author),
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