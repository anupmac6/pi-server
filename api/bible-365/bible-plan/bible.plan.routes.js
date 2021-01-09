const express = require("express");

const router = express.Router();

const ctrl = require("./bible.plan.controller");

// [POST] /api/bible-365/bible-plan
router.post("/", ctrl.createBiblePlan);

// [GET] /api/bible-365/bible-plan
router.get("/", ctrl.getBiblePlanAll);

// [GET] /api/bible-365/bible-plan/:userId
router.get("/:userId", ctrl.getBiblePlanByUser);

// unsubscribe

// pause

// change format

// change time

// change translation

// change bible time period view

// change start day

module.exports = router;
