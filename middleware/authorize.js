const config = require("config");
const SECRET = config.get("Security");

/**
 * Middleware to ensure we serve only the request which have valid tokens
 */

module.exports = (req, res, next) => {
  //* extract the Authorization header from the request

  const KeyHeader = req.get("x-api-key");

  if (!KeyHeader) {
    const error = new Error("No Api Key Provided!");
    error.statusCode = 401;
    next(error);
  } else if (SECRET.key === KeyHeader) {
    //* API KEY provided
    next();
  } else {
    const error = new Error("Invalid Api Key!");
    error.statusCode = 401;
    next(error);
  }
};
