const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");

router.get("/registration-settings", authController.getRegistrationSettings);
router.post("/login/request-otp", authController.requestLoginOtp);
router.post("/login/verify-otp", authController.verifyLoginOtp);
router.post("/login/resend-otp", authController.resendLoginOtp);
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/set-password", authController.setpassword);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;