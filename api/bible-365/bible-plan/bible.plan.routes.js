const express = require("express");

const router = express.Router();

const ctrl = require("./bible.plan.controller");

// [POST] /api/bible-365/bible-plan
router.post("/", ctrl.createBiblePlan);

// [GET] /api/bible-365/bible-plan
router.get("/", ctrl.getBiblePlanAll);

// [GET] /api/bible-365/bible-plan/:userId
router.get("/:userId", ctrl.getBiblePlanByUser);

// [GET] /api/bible-365/bible-plan/:userId/unsubscribe
router.get("/:userId/unsubscribe", ctrl.unsubscribe);

// [GET] /api/bible-365/bible-plan/:userId/pause-plan/:pauseDuration
router.get("/:userId/pause-plan/:pauseDuration", ctrl.pauseBiblePlan);

// [GET] /api/bible-365/bible-plan/:userId/resume-plan
router.get("/:userId/resume-plan", ctrl.resumeBiblePlan);

// [GET] /api/bible-365/bible-plan/:userId/receive-format/:formatId
router.get("/:userId/receive-format/:formatId", ctrl.changeReceiveFormat);

// [GET] /api/bible-365/bible-plan/:userId/preferred-time/:preferredTime
router.get("/:userId/preferred-time/:preferredTime", ctrl.changePreferredTime);

// change translation

// change bible time period view

// change start day

module.exports = router;
