const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const eventController = require("./event.controller");
const upload = require("../../middleware/upload");
const generateEventId = require("../../middleware/generateEventId");

//Add Multer to the POST route
router.post(
  "/create-event",
  authMiddleware,
  generateEventId,
  upload.fields([
    { name: "hostOneImage", maxCount: 1 },
    { name: "hostTwoImage", maxCount: 1 },
    { name: "invitation", maxCount: 1 },
  ]),
  eventController.createEvent
);
router.get("/event-types", authMiddleware, eventController.eventTypes);
router.get("/events-list/:userId", authMiddleware, eventController.eventLists);

// router.get("/", eventController.getMyEvents);
// router.get("/:id", eventController.getEventById);
// router.put("/update:id", eventController.updateEvent);
// router.delete("/delete:id", eventController.deleteEvent);

module.exports = router;