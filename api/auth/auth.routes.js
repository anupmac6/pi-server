const express = require("express");

const router = express.Router();

const ctrl = require("./auth.controller");

//[POST] /api/auth/login
router.post("/login", ctrl.login);

//[POST] /api/auth/signup
router.post("/signup", ctrl.signup);

//[POST] /api/auth/forgot-password
router.post("/forgot-password", ctrl.forgotPassword);

//[POST] /api/auth/change-password
router.post("/change-password", ctrl.changePassword);

module.exports = router;
