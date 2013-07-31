module.exports = function(config, dependencies, job_callback) {

  var businessDays = 0;

  var dueDate = dependencies.moment(config.dueDate);
  var days = dueDate.diff(new Date(), 'days');
  for(i = 0; i < days; i++) {
    dueDate.add(1, 'day');
    // exclude Sundays (0) and Saturdays (6). Not accounting for public holidays ATM
    if (dueDate.day() != 0 && dueDate.day() != 6) {
      businessDays++;
    }
  }

  job_callback(null, {days: businessDays, title: config.milestone});
};
