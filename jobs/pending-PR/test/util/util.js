function createUserElement(username) {
  return {
    user : {
      name: username
    }
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


module.exports = {
  getFakeStashPR: getFakeStashPR
}