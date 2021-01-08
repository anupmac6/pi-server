const express = require("express");

const router = express.Router();

const ctrl = require("./schedule.data.controller");

// [GET] /api/bible-365/schedule-data/:scheduleId
router.get("/:scheduleId", ctrl.getByScheduleId);

module.exports = router;
