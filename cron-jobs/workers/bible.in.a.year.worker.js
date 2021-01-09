const { map } = require("lodash");
const biblePlanService = require("../../api/bible-365/bible-plan/bible.plan.service");
const scheduleDataService = require("../../api/bible-365/schedule-data/schedule.data.service");
const emailBuilder = require("../../emails/bible-plan/bible.plan.email.snippets");
const email = require("../../emails/email.send");
// 1. Get the time worker is running
// 2. Get all the bible plans with that time preferred
//     Apply Filters
//         1. isUnsubscribed
//         2. isPaused
//         3. startDay > today ? false
// 3. Populate the user to get name and email
// 4. For each of the bible plan do the following
//     1. Get the schedule data where shcedule = bibleplan.currentDay
//     2. populate schedule
//     3. generate email
//     4. send email
//     5. increment the currentDay
//     6. add data to history

exports.bibleInAYearWorker = async (timeToRun) => {
  const biblePlans = await biblePlanService.getAllBiblePlansForCronJob(
    timeToRun
  );
  await Promise.all(
    map(biblePlans, async (biblePlan) => {
      let scheduleData = await scheduleDataService.getByScheduleId(
        +biblePlan.currentDay
      );
      if (scheduleData.schedule === timeToRun) {
        scheduleData = await scheduleDataService.getByScheduleId(
          +biblePlan.currentDay
        );
      }

      const emailContent = emailBuilder.getBiblePlanEmailTemplate(
        biblePlan,
        scheduleData
      );

      const response = email.sendEmail(
        biblePlan.user.email,
        `Bible in a year - Day ${timeToRun}`,
        emailContent
      );

      console.log(response);
      return response;
    })
  );
  return biblePlans;
};
