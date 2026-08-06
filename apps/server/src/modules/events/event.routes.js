const express = require("express");
const router = express.Router();

const controller = require("./event.controller");

router.get("/", controller.getAllEvents);
router.post("/", controller.createEvent);
router.get("/:id", controller.getEventById);
router.put("/:id", controller.updateEvent);
router.delete("/:id", controller.deleteEvent);

module.exports = router;