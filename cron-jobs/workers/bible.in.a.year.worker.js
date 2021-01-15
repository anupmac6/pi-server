const { map, trim } = require("lodash");
const biblePlanService = require("../../api/bible-365/bible-plan/bible.plan.service");
const scheduleDataService = require("../../api/bible-365/schedule-data/schedule.data.service");
const emailBuilder = require("../../emails/bible-plan/bible.plan.email.snippets");
const email = require("../../emails/email.send");
const { BiblePlanError } = require("../../models/bibleplanerror");
const { BiblePlanHistory } = require("../../models/bibleplanhistory");
const moment = require("moment");
const { User } = require("../../models/user");
const { BiblePlan } = require("../../models/bibleplan");
const { Subscriber } = require("../../models/subscriber");
const { firestore } = require("../../firebase");
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
    const message = "Failed to get all the bible plans.";
    await saveError({ message });
    throw new Error(message);
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

const generateEmailContent = (biblePlan, scheduleData) => {
  const content = emailBuilder.getBiblePlanEmailTemplate(
    biblePlan,
    scheduleData
  );
  return content;
};

const sendEmail = async (to, subject, content, biblePlan) => {
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
      planDay: +biblePlan.currentDay - 1,
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
const makeSureUserIsNotGettingSecondEmail = async (biblePlan) => {
  try {
    const biblePlanHistory = await BiblePlanHistory.findOne({
      user: biblePlan.user._id,
      createdAt: {
        $gte: moment()
          .utcOffset(0)
          .set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
      },
    });

    if (biblePlanHistory) {
      throw new Error("User has already received the email for today.");
    }
  } catch (error) {
    const user = biblePlan.user._id;
    const planDay = +biblePlan.currentDay;
    await saveError({ user, planDay, error });
    throw new Error(error);
  }
};
const getUserByEmail = async (to) => {
  try {
    const user = await User.findOne().where("email").equals(trim(to));
    if (!user) {
      throw new Error("User does not exists");
    }
    return user;
  } catch (error) {
    const message = "User does not exists.";
    await saveError({ message });
    throw new Error(message);
  }
};
const getBiblePlanByUser = async (userId) => {
  try {
    const biblePlan = BiblePlan.findOne()
      .where("user")
      .equals(userId)
      .populate("user");
    if (!biblePlan) {
      throw new Error("Bible Plan does not exists");
    }
    return biblePlan;
  } catch (error) {
    const message = "Bible Plan does not exists.";
    await saveError({ message });
    throw new Error(message);
  }
};
exports.bibleInAYearEmailAfterSubscribe = async (to) => {
  try {
    //* Get user info by email
    const user = await getUserByEmail(to);
    //* Get bible plan for the user
    const biblePlan = await getBiblePlanByUser(user._id);
    //* Process bible plan
    await processBiblePlan(biblePlan);
    return to;
  } catch (error) {
    return "fail";
  }
};
const processBiblePlan = async (biblePlan) => {
  //* Make sure user does not get two emails a day due to signup today
  await makeSureUserIsNotGettingSecondEmail(biblePlan);
  //* - Get schedule information
  const scheduleData = await getSchedule(+biblePlan.currentDay, biblePlan);
  //* - Generate email content for the schedule
  const emailContent = generateEmailContent(biblePlan, scheduleData);
  //* - Send Email
  await sendEmail(
    biblePlan.user.email,
    `The Bible in a Year - Day ${+biblePlan.currentDay}`,
    emailContent,
    biblePlan
  );
  //* - Update current day of bible plan
  await updateCurrentDay(biblePlan);
  //* - Add to History
  await saveToHistory(biblePlan);
};
exports.bibleInAYearWorker = async (timeToRun) => {
  try {
    //* - Get bible plans
    const biblePlans = await getAllBiblePlans(timeToRun);
    //* Apply algorithm for each of the bible plan
    await Promise.all(
      map(biblePlans, async (biblePlan) => {
        // Process bible plan
        await processBiblePlan(biblePlan);
        return biblePlan;
      })
    );
    return biblePlans;
  } catch (error) {
    return "fail";
  }
};
exports.checkForNewBiblePlanSubscriber = async () => {
  try {
    //* Get all subscribers
    const subscriberRef = firestore.collection("subscriber");
    const snapshot = await subscriberRef.get();
    let subscribers = [];
    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        subscribers.push({ ...{ id: doc.id }, ...doc.data() });
      });
    }

    //* Trigger subscribe method
    await Promise.all(
      map(subscribers, async (subscriber) => {
        try {
          await biblePlanService.subscribe(subscriber.email);
        } catch (error) {}
        await firestore.collection("subscriber").doc(subscriber.id).delete();
        return subscriber;
      })
    );
    //* delete the subscribe
    console.log("check for subscriber");
  } catch (error) {
    return "fail";
  }
};
