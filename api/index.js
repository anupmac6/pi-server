const express = require("express");

//* Create a Router
const router = express.Router();

//* Import Authorize Middleware
const authorize = require("../middleware/authorize");

//* Import Health Routes
const healthRoutes = require("./health/health.routes");

//* Import Bible 365 Routes
const bibleRoutes = require("./bible-365/bible.routes");

//[] /api/health
router.use("/health", healthRoutes);

//[] /api/bible-365
router.use("/bible-365", bibleRoutes);

module.exports = router;
