module.exports = function(config, dependencies, job_callback) {

  function DayDiff(CurrentDate, DueDate) {
    var TYear=CurrentDate.getFullYear();
    var TDay=new Date(DueDate);
    TDay.getFullYear(TYear);
    var DayCount=(TDay-CurrentDate)/(1000*60*60*24);
    DayCount=Math.round(DayCount);
    return(DayCount);
  }

  var today = new Date();
  var dueDate = config.dueDate;
  var days = DayDiff(today, dueDate);
  var milestone = config.milestone;

  job_callback(null, {days: days, milestone: milestone});
};
