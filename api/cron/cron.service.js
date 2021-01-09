const agenda = require("../../cron-jobs/cron.job");
const biblePlanWorker = require("../../cron-jobs/workers/bible.in.a.year.worker");

exports.createBibleInAYearMidnightJob = async () => {
  agenda.define(
    "bible in a year midnight",
    { priority: "high", concurrency: 10 },
    async (job) => {
      await biblePlanWorker.bibleInAYearWorker(1);
    }
  );

  const response = await agenda.every("30 seconds", "bible in a year midnight");
  return response;
};

const deleteJob = async (job) => {
  const response = await agenda.cancel({ name: job });
  if (!response) {
    throw new Error("Cron job does not exist.");
  }
  return response;
};

exports.deleteBibleInAYearMidnightJob = async () => {
  return await deleteJob("bible in a year midnight");
};

exports.createBibleInAYearEarlyMorningJob = async () => {
  agenda.define(
    "bible in a year early morning",
    { priority: "high", concurrency: 10 },
    async (job) => {
      console.log("run every early morning");
    }
  );

  const response = await agenda.every(
    "00 05 * * *",
    "bible in a year early morning"
  );
  return response;
};

exports.deleteBibleInAYearEarlyMorningJob = async () => {
  return await deleteJob("bible in a year early morning");
};

exports.createBibleInAYearMorningJob = async () => {
  agenda.define(
    "bible in a year morning",
    { priority: "high", concurrency: 10 },
    async (job) => {
      console.log("run every morning");
    }
  );

  const response = await agenda.every("00 08 * * *", "bible in a year morning");
  return response;
};

exports.deleteBibleInAYearMorningJob = async () => {
  return await deleteJob("bible in a year morning");
};

exports.createBibleInAYearEveningJob = async () => {
  agenda.define(
    "bible in a year evening",
    { priority: "high", concurrency: 10 },
    async (job) => {
      console.log("run every evening");
    }
  );

  const response = await agenda.every("00 17 * * *", "bible in a year evening");
  return response;
};

exports.deleteBibleInAYearEveningJob = async () => {
  return await deleteJob("bible in a year evening");
};

exports.createBibleInAYearNightJob = async () => {
  agenda.define(
    "bible in a year night",
    { priority: "high", concurrency: 10 },
    async (job) => {
      console.log("run every night");
    }
  );

  const response = await agenda.every("00 21 * * *", "bible in a year night");
  return response;
};

exports.deleteBibleInAYearNightJob = async () => {
  return await deleteJob("bible in a year night");
};
