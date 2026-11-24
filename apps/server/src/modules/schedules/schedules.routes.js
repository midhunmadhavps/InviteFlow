const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const controller = require("./schedules.controller");

router.get("/payment-status", authMiddleware, controller.getEventPaymentStatus);
router.get("/", authMiddleware, controller.getScheduleInvites);
router.post("/", authMiddleware, controller.createScheduleInvites);
router.patch("/:id", authMiddleware, controller.updateScheduleInviteStatus);
router.delete("/:id", authMiddleware, controller.deletePendingScheduleInvite);

module.exports = router;