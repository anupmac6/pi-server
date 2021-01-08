const express = require("express");

const router = express.Router();

const ctrl = require("./bible.plan.controller");

// [POST] /api/bible-365/bible-plan
router.post("/", ctrl.createBiblePlan);

// [GET] /api/bible-365/bible-plan
router.get("/", ctrl.getBiblePlanAll);

// [GET] /api/bible-365/bible-plan/:userId
router.get("/:userId", ctrl.getBiblePlanByUser);

module.exports = router;
