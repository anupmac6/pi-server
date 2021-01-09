const createError = require("http-errors");
const express = require("express");
const path = require("path");

const cookieParser = require("cookie-parser");
const logger = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// import response wrapper middleware
const responseWrapper = require("./middleware/response.wrapper");
// import error handler middleware
const errorHandler = require("./middleware/error.handler");

// import routes for '/api'
const apiRoutes = require("./api");

const agenda = require("./cron-jobs/cron.job");
agenda.start();
app.use(cors());

app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * Custom Routes Middleware
 */
app.use("/api", apiRoutes);

/**
 * Passport
 */
require("./passport/passport.config");
/**
 * Custom Middlewares
 */

// response handler
app.use(responseWrapper);
// error handler
app.use(errorHandler);

module.exports = app;
