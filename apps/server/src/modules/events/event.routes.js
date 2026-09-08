const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const eventController = require("./event.controller");

router.post("/create-event", authMiddleware, eventController.createEvent);
router.get("/event-types", authMiddleware, eventController.eventTypes);

// router.get("/", eventController.getMyEvents);
// router.get("/:id", eventController.getEventById);
// router.put("/update:id", eventController.updateEvent);
// router.delete("/delete:id", eventController.deleteEvent);

module.exports = router;