const { Schedule } = require("../../../models/schedule");
const { ScheduleData } = require("../../../models/scheduledata");
const axios = require("axios");
const jsdom = require("jsdom");
const { map, lowerCase, trim, forEach } = require("lodash");

const validateScheduleId = async (scheduleId) => {
  if (isNaN(scheduleId)) {
    throw new Error("Invalid Schedule Id");
  }
  if (scheduleId <= 0 || scheduleId > 365) {
    throw new Error("Invalid Schedule Id");
  }
};

const getScheduleDataByScheduleId = async (scheduleId) => {
  const scheduleData = await ScheduleData.findOne()
    .where("schedule")
    .equals(scheduleId)
    .populate("schedule");

  if (!scheduleData) {
    await createScheduleDataByScheduleId(scheduleId);
    const newScheduleData = await ScheduleData.findOne()
      .where("schedule")
      .equals(scheduleId)
      .populate("schedule");
    return newScheduleData;
  }

  return scheduleData;
};

const createScheduleDataByScheduleId = async (scheduleId) => {
  //* - Get Schedule Information
  const schedule = await getScheduleById(scheduleId);

  //* - Generate schedule data object

  const scheduleDataObject = await generateScheduleDataObject(schedule);

  //* - Create New Schedule Data
  const scheduleData = new ScheduleData(scheduleDataObject);

  const response = await scheduleData.save();
  return response;
};

const getScheduleById = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId).select(
    "firstReading secondReading psalm"
  );
  if (!schedule) {
    const exception = new Error("No Schedule found.");
    exception.statusCode = 400;
    throw exception;
  }

  return schedule;
};

const generateScheduleDataObject = async (schedule) => {
  try {
    let data = { schedule: schedule._id };
    //* FIRST READING
    let firstReading = await Promise.all(
      map(schedule.firstReading, async (reading) => {
        let verse = await getBibleTextByVerse(reading.verse);
        return {
          _id: reading._id,
          verse,
        };
      })
    );
    //* SECOND READING
    let secondReading = await Promise.all(
      map(schedule.secondReading, async (reading) => {
        let verse = await getBibleTextByVerse(reading.verse);
        return {
          _id: reading._id,
          verse,
        };
      })
    );
    //* PSALM
    let psalm = await Promise.all(
      map(schedule.psalm, async (reading) => {
        let verse = await getBibleTextByVerse(reading.verse);
        return {
          _id: reading._id,
          verse,
        };
      })
    );
    data.firstReadingData = firstReading;
    data.secondReadingData = secondReading;
    data.psalmData = psalm;
    return data;
  } catch (error) {
    throw error;
  }
};

const getBibleTextByVerse = async (verse) => {
  if (!trim(verse)) {
    return null;
  }
  try {
    let updatedVerse = verse.replace(/\s+/g, "");
    const response = await axios.default.get(
      `https://www.biblegateway.com/passage/?search=${updatedVerse.toLowerCase()}&version=RSVCE`
    );
    const dom = new jsdom.JSDOM(response.data);

    let content = dom.window.document.querySelector(".passage-content>div");
    let footnotes = dom.window.document.querySelector(".footnotes");
    if (content) {
      if (footnotes) {
        content.removeChild(footnotes);
      }
      return content.innerHTML;
    } else {
      throw new Error("Failed to get Bible Text.");
    }
  } catch (error) {
    throw new Error("Failed to get Bible Text.");
  }
};

exports.getByScheduleId = async (scheduleId) => {
  //* - Validate schedule id
  await validateScheduleId(scheduleId);
  //* - Get Schedule Data Information
  const data = await getScheduleDataByScheduleId(scheduleId);
  return data;
};
