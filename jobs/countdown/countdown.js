module.exports = function(config, dependencies, job_callback) {
  job_callback(null, {
    when: dependencies.moment(config.dueDate).fromNow(), 
    milestone: config.milestone
  });
};
