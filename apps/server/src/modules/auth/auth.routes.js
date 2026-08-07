const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/set-password", authController.setpassword);
router.post("/login", authController.login);

module.exports = router;