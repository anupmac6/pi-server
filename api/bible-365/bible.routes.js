const express = require("express");

const router = express.Router();

const schedulesRoutes = require("./schedules/schedules.routes");
const scheduleDataRoutes = require("./schedule-data/schedule.data.routes");

// [] /api/bible-365/schedules
router.use("/schedules", schedulesRoutes);

// [] /api/bible-365/schedule-data
router.use("/schedule-data", scheduleDataRoutes);

module.exports = router;
