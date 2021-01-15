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
  const userId = req.params.userId;
  await biblePlan
    .getBiblePlanByUser(userId)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.unsubscribe = async (req, res, next) => {
  const userId = req.params.userId;
  await biblePlan
    .unsubscribeUser(userId)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.pauseBiblePlan = async (req, res, next) => {
  const userId = req.params.userId;
  const pauseDuration = req.params.pauseDuration;
  await biblePlan
    .pauseBiblePlanForUser(userId, pauseDuration)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.resumeBiblePlan = async (req, res, next) => {
  const userId = req.params.userId;
  await biblePlan
    .resumeBiblePlanForUser(userId)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.changeReceiveFormat = async (req, res, next) => {
  const userId = req.params.userId;
  const receiveFormat = req.params.formatId;
  await biblePlan
    .changeReceiveFormatForUser(userId, receiveFormat)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.changePreferredTime = async (req, res, next) => {
  const userId = req.params.userId;
  const preferredTime = req.params.preferredTime;
  await biblePlan
    .changePreferredTimeForUser(userId, preferredTime)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.subscribe = async (req, res, next) => {
  await biblePlan
    .subscribe(req.body.email)
    .then((result) => next(result))
    .catch((err) => next(err));
};
