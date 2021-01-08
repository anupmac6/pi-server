const scheduleData = require("./schedule.data.service");

exports.getByScheduleId = async (req, res, next) => {
  const scheduleId = +req.params.scheduleId;
  await scheduleData
    .sendEmail(scheduleId)
    .then((result) => next(result))
    .catch((err) => next(err));
};
