const express = require("express");

//* Create a Router
const router = express.Router();

//* Import Authorize Middleware
const authorize = require("../middleware/authorize");

//* Import Health Routes
const healthRoutes = require("./health/health.routes");

//[] /api/health
router.use("/health", healthRoutes);

module.exports = router;
