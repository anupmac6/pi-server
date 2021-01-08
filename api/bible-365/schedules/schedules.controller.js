const bible = require("./schedules.service");

exports.initializeSchedule = async (req, res, next) => {
  await bible
    .initializeSchedule()
    .then((result) => next(result))
    .catch((err) => next(err));
};
