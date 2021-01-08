const csv = require("csvtojson");
const path = require("path");
const { map, split } = require("lodash");
const { Schedule } = require("../../../models/schedule");

const extractScheduleFromCSV = async () => {
  try {
    return await csv().fromFile(__dirname + "/../../../assets/bible-365.csv");
  } catch (error) {
    throw new Error("Failed to extract schedules from CSV.");
  }
};

const mapSchedulesToModel = (schedules) => {
  try {
    const updatedSchedules = map(schedules, (schedule) => {
      let data = { _id: +schedule.Day };
      data.period = schedule.Period;
      //split the first reading
      const firstReadings = split(schedule.First, ",");
      data.firstReading = map(firstReadings, (reading, index) => ({
        _id: index + 1,
        verse: reading,
      }));
      //split the second reading
      const secondReadings = split(schedule.Second, ",");
      data.secondReading = map(secondReadings, (reading, index) => ({
        _id: index + 1,
        verse: reading,
      }));
      //split the psalms
      const psalms = split(schedule.Psalms, ",");
      data.psalm = map(psalms, (psalm, index) => ({
        _id: index + 1,
        verse: psalm,
      }));
      return data;
    });

    return updatedSchedules;
  } catch (error) {
    throw new Error("Failed to map the schedule to database model.");
  }
};

const deleteAllSchedules = async () => {
  try {
    await Schedule.deleteMany({});
  } catch (error) {
    throw new Error("Failed to delete all the schedules.");
  }
};

exports.initializeSchedule = async () => {
  //* - Delete all the schedules
  await deleteAllSchedules();
  //* - Extract the schedule from CSV
  const rawSchedules = await extractScheduleFromCSV();
  //* - Map the schedule to Model
  const schedules = await mapSchedulesToModel(rawSchedules);
  //* - Insert the schedules to the database
  const response = await Schedule.insertMany(schedules);
  return response;
};
