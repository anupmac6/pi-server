const express = require("express");

//* Create a Router
const router = express.Router();

//* Import Authorize Middleware
const authorize = require("../middleware/authorize");

router.get("/", (req, res, next) => {
  next("anup macwan");
});

module.exports = router;
