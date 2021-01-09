const mongoose = require("mongoose");
const { BiblePlan, validateBiblePlan } = require("../../../models/bibleplan");
const { User } = require("../../../models/user");
const agenda = require("../../../cron-jobs/cron.job");

const makeSureBiblePlanDoesNotExistForUser = async (user) => {
  const biblePlan = await BiblePlan.findOne({ user });

  if (biblePlan) {
    throw new Error("Bible plan already exists for the user.");
  }
};
exports.createBiblePlanForUser = async (biblePlan) => {
  //* Validate the object first
  const error = await validateBiblePlan(biblePlan);
  if (error) {
    throw error;
  }
  //* Ensure bible plan does not exist
  await makeSureBiblePlanDoesNotExistForUser(biblePlan.user);
  //* Create bible plan
  const newBiblePlan = new BiblePlan(biblePlan);
  const response = await newBiblePlan.save();
  return response;
};

exports.getBiblePlanAll = async () => {
  //* Get all bible plans
  const biblePlans = await BiblePlan.find({})
    .populate("user", "name email")
    .select(
      "includeAdventureBibleTimePeriod bibleTranslation receiveFormat preferredTime isPaused isUnsubscribed user"
    );
  const weeklyReport = agenda.create("send email report", {
    to: "example@example.com",
  });
  await agenda.start();
  await weeklyReport.repeatEvery("10 second").save();

  return biblePlans;
};

const isValidUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User does not exist.");
  }
};

exports.getBiblePlanByUser = async (userId) => {
  //* Check if valid user
  await isValidUser(userId);
  //* Get the bible plan
  const biblePlan = await BiblePlan.findOne({
    user: mongoose.Types.ObjectId(userId),
  })
    .populate("user", "name email")
    .select(
      "includeAdventureBibleTimePeriod bibleTranslation receiveFormat preferredTime isPaused isUnsubscribed user"
    );
  if (!biblePlan) {
    throw new Error("User not subscribed to Bible plan.");
  }
  return biblePlan;
};

exports.unsubscribeUser = async (userId) => {
  //* Get the bible plan
  const biblePlan = await this.getBiblePlanByUser(userId);
  //* Update the bible plan
  biblePlan.isUnsubscribed = true;
  //* Save the bible plan
  const response = await biblePlan.save();
  return response;
};

exports.pauseBiblePlanForUser = async (userId, pauseDuration) => {
  if (isNaN(+pauseDuration)) {
    throw new Error("Invalid paused for days.");
  }
  //* Get the bible plan
  const biblePlan = await this.getBiblePlanByUser(userId);
  //* Update the bible plan
  biblePlan.isPaused = true;
  biblePlan.pausedFor = +pauseDuration;
  //* Save the bible plan
  const response = await biblePlan.save();
  return response;
};

exports.resumeBiblePlanForUser = async (userId) => {
  //* Get the bible plan
  const biblePlan = await this.getBiblePlanByUser(userId);
  //* Update the bible plan
  biblePlan.isPaused = false;
  biblePlan.pausedFor = 0;
  //* Save the bible plan
  const response = await biblePlan.save();
  return response;
};

exports.changeReceiveFormatForUser = async (userId, receiveFormat) => {
  //* Validate the receive format
  if (+receiveFormat <= 0 || +receiveFormat >= 4 || isNaN(+receiveFormat)) {
    throw new Error("Invalid receive format submitted");
  }
  //* Get the bible plan
  const biblePlan = await this.getBiblePlanByUser(userId);
  //* Update the bible plan
  biblePlan.receiveFormat = +receiveFormat;
  //* Save the bible plan
  const response = await biblePlan.save();
  return response;
};

exports.changePreferredTimeForUser = async (userId, preferredTime) => {
  //* Validate the preferred time
  if (+preferredTime < 0 || +preferredTime >= 5 || isNaN(+preferredTime)) {
    throw new Error("Invalid preferred time submitted");
  }
  //* Get the bible plan
  const biblePlan = await this.getBiblePlanByUser(userId);
  //* Update the bible plan
  biblePlan.preferredTime = +preferredTime;
  //* Save the bible plan
  const response = await biblePlan.save();
  return response;
};
