const express = require("express");

const router = express.Router();

const schedulesRoutes = require("./schedules/schedules.routes");
const scheduleDataRoutes = require("./schedule-data/schedule.data.routes");
const biblePlanRoutes = require("./bible-plan/bible.plan.routes");

// [] /api/bible-365/schedules
router.use("/schedules", schedulesRoutes);

// [] /api/bible-365/schedule-data
router.use("/schedule-data", scheduleDataRoutes);

// [] /api/bible-365/bible-plan
router.use("/bible-plan", biblePlanRoutes);

module.exports = router;
