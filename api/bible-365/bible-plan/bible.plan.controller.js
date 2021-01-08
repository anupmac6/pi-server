const biblePlan = require("./bible.plan.service");

exports.createBiblePlan = async (req, res, next) => {
  await biblePlan
    .createBiblePlanForUser(req.body)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.getBiblePlanAll = async (req, res, next) => {
  await biblePlan
    .getBiblePlanAll()
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.getBiblePlanByUser = async (req, res, next) => {
  await biblePlan
    .getBiblePlanByUser(req.params.userId)
    .then((result) => next(result))
    .catch((err) => next(err));
};
