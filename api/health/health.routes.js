const express = require("express");

const router = express.Router();

const ctrl = require("./health.controller");

// [GET] /api/health
router.get("/", ctrl.healthCheck);

module.exports = router;
