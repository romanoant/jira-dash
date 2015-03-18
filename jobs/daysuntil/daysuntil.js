module.exports = function(config, dependencies, job_callback) {

  var businessDays = 0;

  var dueDate = dependencies.moment(config.dueDate);
  var today = dependencies.moment();

  // days between today and dueDate and then add one to include today
  var days = dueDate.diff(today, 'days') + 1;

  var currentDay = today.clone();
  for(i = 0; i < days; i++) {
    // exclude Sundays (0) and Saturdays (6). Not accounting for public holidays ATM
    if (currentDay.day() != 0 && currentDay.day() != 6) {
      businessDays++;
    }
    currentDay.add(1, 'day');
  }

  job_callback(null, {days: businessDays, title: config.milestone});
};
