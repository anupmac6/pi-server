const cron = require("./cron.service");

exports.bibleInAYearMidnight = async (req, res, next) => {
  await cron
    .createBibleInAYearMidnightJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.deleteBibleInAYearMidnight = async (req, res, next) => {
  await cron
    .deleteBibleInAYearMidnightJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.bibleInAYearEarlyMorning = async (req, res, next) => {
  await cron
    .createBibleInAYearEarlyMorningJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.deleteBibleInAYearEarlyMorning = async (req, res, next) => {
  await cron
    .deleteBibleInAYearEarlyMorningJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.bibleInAYearMorning = async (req, res, next) => {
  await cron
    .createBibleInAYearMorningJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.deleteBibleInAYearMorning = async (req, res, next) => {
  await cron
    .deleteBibleInAYearMorningJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.bibleInAYearEvening = async (req, res, next) => {
  await cron
    .createBibleInAYearEveningJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.deleteBibleInAYearEvening = async (req, res, next) => {
  await cron
    .deleteBibleInAYearEveningJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.bibleInAYearNight = async (req, res, next) => {
  await cron
    .createBibleInAYearNightJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.deleteBibleInAYearNight = async (req, res, next) => {
  await cron
    .deleteBibleInAYearNightJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.checkForNewSubscriber = async (req, res, next) => {
  await cron
    .createCheckSubscriberListJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.deleteCheckForNewSubscriber = async (req, res, next) => {
  await cron
    .deleteCheckSubscriberListJob()
    .then((result) => next(result))
    .catch((err) => next(err));
};
