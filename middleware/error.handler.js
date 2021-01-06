const status = require("http-status");

/**
 * Using this middleware we will strip out the error message in a format that is recognizable by the Web App
 */

module.exports = async (error, req, res, next) => {
  // if there is no error pass it on to the next middleware in line
  if (!error) {
    next();
  }

  //* extract the information out of the error object
  const StatusCode = error.statusCode || 500;
  const ErrorMessage = error.message;
  const Data = error.message;

  //* wrap the extracted error information in the format Web App is looking for
  res.status(status.OK).json({
    StatusCode,
    ErrorMessage,
    Data,
  });
};
