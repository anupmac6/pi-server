const express = require("express");

const router = express.Router();

const ctrl = require("./cron.controller");

// [GET] /api/cron/bible-in-a-year-midnight
router.get("/bible-in-a-year-midnight", ctrl.bibleInAYearMidnight);

//! [DELETE] /api/cron/bible-in-a-year-midnight
router.delete("/bible-in-a-year-midnight", ctrl.deleteBibleInAYearMidnight);

// [GET] /api/cron/bible-in-a-year-early-morning
router.get("/bible-in-a-year-early-morning", ctrl.bibleInAYearEarlyMorning);

//! [DELETE] /api/cron/bible-in-a-year-early-morning
router.delete(
  "/bible-in-a-year-early-morning",
  ctrl.deleteBibleInAYearEarlyMorning
);

// [GET] /api/cron/bible-in-a-year-morning
router.get("/bible-in-a-year-morning", ctrl.bibleInAYearMorning);

//! [DELETE] /api/cron/bible-in-a-year-morning
router.delete("/bible-in-a-year-morning", ctrl.deleteBibleInAYearMorning);

// [GET] /api/cron/bible-in-a-year-evening
router.get("/bible-in-a-year-evening", ctrl.bibleInAYearEvening);

//! [DELETE] /api/cron/bible-in-a-year-evening
router.delete("/bible-in-a-year-evening", ctrl.deleteBibleInAYearEvening);

// [GET] /api/cron/bible-in-a-year-night
router.get("/bible-in-a-year-night", ctrl.bibleInAYearNight);

//! [DELETE] /api/cron/bible-in-a-year-night
router.delete("/bible-in-a-year-night", ctrl.deleteBibleInAYearNight);

// [GET] /api/cron/check-for-new-subscribers
router.get("/check-for-new-subscribers", ctrl.checkForNewSubscriber);

//! [DELETE] /api/cron/check-for-new-subscribers
router.delete("/check-for-new-subscribers", ctrl.deleteCheckForNewSubscriber);
module.exports = router;
