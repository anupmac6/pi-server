const express = require("express");

const router = express.Router();

const ctrl = require("./schedules.controller");

// [GET] /api/bible-365/schedules/init
router.get("/init", ctrl.initializeSchedule);

module.exports = router;
