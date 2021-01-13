const { map } = require("lodash");
const biblePlanService = require("../../api/bible-365/bible-plan/bible.plan.service");
const scheduleDataService = require("../../api/bible-365/schedule-data/schedule.data.service");
const emailBuilder = require("../../emails/bible-plan/bible.plan.email.snippets");
const email = require("../../emails/email.send");
const { BiblePlanError } = require("../../models/bibleplanerror");
const { BiblePlanHistory } = require("../../models/bibleplanhistory");
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

const getAllBiblePlans = async (timeToRun) => {
  try {
    const biblePlans = await biblePlanService.getAllBiblePlansForCronJob(
      timeToRun
    );
    return biblePlans;
  } catch (error) {
    const messsage = "Failed to get all the bible plans.";
    await saveError({ message });
    throw new Error(messsage);
  }
};

const getSchedule = async (scheduleId, biblePlan) => {
  try {
    const schedule = await scheduleDataService.getByScheduleId(scheduleId);
    return schedule;
  } catch (error) {
    const message = "Failed to get the schedule information";
    const user = biblePlan.user._id;
    const planDay = +biblePlan.currentDay;
    await saveError({ user, planDay, error });
    throw new Error(message);
  }
};

const generateEmailContent = async (biblePlan, scheduleData) => {
  try {
    const content = emailBuilder.getBiblePlanEmailTemplate(
      biblePlan,
      scheduleData
    );
    return content;
  } catch (error) {
    const message = "Failed to generate email content";
    const user = biblePlan.user._id;
    const planDay = +biblePlan.currentDay;
    await saveError({ user, planDay, error });
    throw new Error(message);
  }
};

const sendEmail = async (to, subject, content) => {
  try {
    const response = await email.sendEmail(to, subject, content);
    return response;
  } catch (error) {
    const message = "Failed to send email";
    const user = biblePlan.user._id;
    const planDay = +biblePlan.currentDay;
    await saveError({ user, planDay, error });
    throw new Error(message);
  }
};

const updateCurrentDay = async (biblePlan) => {
  try {
    if (biblePlan.currentDay === 365) {
      biblePlan.isFinished = true;
    } else {
      biblePlan.currentDay = biblePlan.currentDay + 1;
    }
    const response = await biblePlan.save();
    return response;
  } catch (error) {
    const message = "Failed to update current day of bible plan.";
    const user = biblePlan.user._id;
    const planDay = +biblePlan.currentDay;
    await saveError({ user, planDay, error });
    throw new Error(message);
  }
};
const saveToHistory = async (biblePlan) => {
  try {
    const history = new BiblePlanHistory({
      user: biblePlan.user._id,
      planDay: +biblePlan.currentDay,
    });
    await history.save();
  } catch (error) {
    const message = "Failed to save the history of bible plan.";
    const user = biblePlan.user._id;
    const planDay = +biblePlan.currentDay;
    await saveError({ user, planDay, error });
    throw new Error(message);
  }
};
const saveError = async (doc) => {
  try {
    const error = new BiblePlanError(doc);
    await error.save();
  } catch (error) {
    throw new Error("Failed to save error.");
  }
};

exports.bibleInAYearWorker = async (timeToRun) => {
  try {
    //* - Get bible plans
    const biblePlans = await getAllBiblePlans(timeToRun);
    //* Apply algorithm for each of the bible plan
    await Promise.all(
      map(biblePlans, async (biblePlan) => {
        //* - Get schedule information
        const scheduleData = await getSchedule(
          +biblePlan.currentDay,
          biblePlan
        );
        //* - Generate email content for the schedule
        const emailContent = generateEmailContent(biblePlan, scheduleData);
        //* - Send Email
        await sendEmail(
          biblePlan.user.email,
          `Bible in a year - Day ${+biblePlan.currentDay}`,
          emailContent,
          biblePlan
        );
        //* - Update current day of bible plan
        await updateCurrentDay(biblePlan);
        //* - Add to History
        await saveToHistory(biblePlan);
        return biblePlan;
      })
    );
    return biblePlans;
  } catch (error) {
    return "fail";
  }
};
