module.exports = function(config, dependencies, job_callback) {

  var businessDays = 0;

  var dueDate = dependencies.moment(config.dueDate);
  var today = dependencies.moment();

  var days = dueDate.diff(today, 'days');

  var currentDay = today.clone();
  for(i = 0; i < days; i++) {
    currentDay.add(1, 'day');
    // exclude Sundays (0) and Saturdays (6). Not accounting for public holidays ATM
    if (currentDay.day() != 0 && currentDay.day() != 6) {
      businessDays++;
    }
  }

  job_callback(null, {days: businessDays, title: config.milestone});
};
