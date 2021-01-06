const status = require("http-status");

/**
 * Using this middleware we will strip out the error message in a format that is recognizable by the Web App
 */

module.exports = async (data, req, res, next) => {
  // if there is no data sent, just pass it on to the next middleware
  if (!data) {
    next();
  }
  //if data is of the type Error then let the error handler middleware (which is next in line) take care of the error
  if (data instanceof Error) {
    next(data);
  } else {
    res.status(status.OK).json({
      StatusCode: status.OK,
      ErrorMessage: null,
      Data: data,
    });
  }
};
