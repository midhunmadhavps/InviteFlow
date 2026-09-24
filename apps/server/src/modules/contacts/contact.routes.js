const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const contactController = require("./contact.controller");

// Contact CRUD routes
router.post("/create", authMiddleware, contactController.createContact);
router.post("/bulk-create", authMiddleware, contactController.bulkCreateContacts);
router.get("/user/:userId", authMiddleware, contactController.getContactsByUserId);
router.get("/:contactId", authMiddleware, contactController.getContactById);
router.put("/:contactId", authMiddleware, contactController.updateContact);
router.delete("/:contactId", authMiddleware, contactController.deleteContact);

module.exports = router;