module.exports = function(config, dependencies, job_callback) {
  
  console.log('----------------------');
  console.log(dependencies.moment(config.dueDate).fromNow());
  console.log('----------------------');
  
  job_callback(null, {
    when: dependencies.moment(config.dueDate).fromNow(), 
    milestone: config.milestone
  });
};
