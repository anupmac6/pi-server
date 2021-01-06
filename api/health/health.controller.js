const health = require("./health.service");

exports.healthCheck = async (req, res, next) => {
  await health
    .summary()
    .then((result) => next(result))
    .catch((err) => next(err));
};
