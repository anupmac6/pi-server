const { response } = require("express");
const mongoose = require("mongoose");
const { BiblePlan, validateBiblePlan } = require("../../../models/bibleplan");
const { User } = require("../../../models/user");
const Joi = require("@hapi/joi");
const emailBuilder = require("../../../emails/bible-plan/bible.plan.email.snippets");
const { sendEmail } = require("../../../emails/email.send");
const agenda = require("../../../cron-jobs/cron.job");
const biblePlanWorker = require("../../../cron-jobs/workers/bible.in.a.year.worker");

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
      "includeAdventureBibleTimePeriod bibleTranslation receiveFormat preferredTime isPaused isUnsubscribed isFinished isCancelled user"
    );

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
      "includeAdventureBibleTimePeriod bibleTranslation receiveFormat preferredTime isPaused isUnsubscribed isFinished isCancelled user"
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

exports.getAllBiblePlansForCronJob = async (preferredTime) => {
  //* Get all bible plans
  const biblePlans = await BiblePlan.find()
    .where("preferredTime")
    .equals(preferredTime)
    .where("isUnsubscribed")
    .equals(false)
    .where("isPaused")
    .equals(false)
    .where("isFinished")
    .equals(false)
    .where("isCancelled")
    .equals(false)
    .populate("user", "name email");

  return biblePlans;
};
const isUserSubscribed = async (userId) => {
  try {
    const biblePlan = await BiblePlan.findOne().where("user").equals(userId);

    if (biblePlan) {
      throw new Error("User is already subscribed");
    }
    return true;
  } catch (error) {
    if (error.message === "User is already subscribed") {
      throw error;
    } else {
      throw new Error("There was an error finding the user by bible plan.");
    }
  }
};
const subscribeUser = async (userId) => {
  try {
    const biblePlan = new BiblePlan({
      user: userId,
    });
    const response = await biblePlan.save();
    return response;
  } catch (error) {
    throw new Error("There was an error subscribing the user.");
  }
};

const createUser = async (email) => {
  try {
    const newUser = new User({ email });
    const response = await newUser.save();
    return response._id;
  } catch (error) {
    throw new Error("There was an error creating new user.");
  }
};
const isValidEmail = async (email) => {
  const schema = Joi.string().email().required();
  try {
    await schema.validateAsync(email);
  } catch (error) {
    const message = error.details.map((i) => i.message).join(",");
    const exception = new Error(message);
    exception.statusCode = 406;
    throw exception;
  }
};
const sendWelcomeEmail = async (email) => {
  try {
    //* Generate email content
    const emailContent = emailBuilder.getBiblePlanWelcomeEmailTemplate();

    const response = await sendEmail(
      email,
      "Welcome to The Bible in a Year",
      emailContent
    );
    return response;
  } catch (error) {
    throw new Error("There was an error sending welcome email to the user.");
  }
};
const scheduleBiblePlanEmail = async (email) => {
  try {
    agenda.define(
      `send bible plan email after subscribe ${email}`,
      { priority: "high", concurrency: 10 },
      async (job) => {
        const { to } = job.attrs.data;
        await biblePlanWorker.bibleInAYearEmailAfterSubscribe(to);
      }
    );

    await agenda.schedule(
      "in 1 minutes",
      `send bible plan email after subscribe ${email}`,
      { to: email }
    );
  } catch (error) {
    throw new Error("Failed to send the bible plan email");
  }
};
exports.subscribe = async (email) => {
  //* Valid email
  await isValidEmail(email);
  //* - Check if user exist
  const user = await User.findOne().where("email").equals(email);
  if (user) {
    // user already exists
    const userNotSubscribed = await isUserSubscribed(user._id);

    if (userNotSubscribed) {
      await subscribeUser(user._id);
      return { subscribed: true };
    }
  } else {
    // user does not exists
    const userId = await createUser(email);
    // subscribe to bible plan
    await subscribeUser(userId);
    // send welcome email
    await sendWelcomeEmail(email);
    // schedule to send bible plan email in 5 mins
    await scheduleBiblePlanEmail(email);
    return { subscribed: true };
  }
};
