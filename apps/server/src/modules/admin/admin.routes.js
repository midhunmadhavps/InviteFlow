const express = require("express");
const router = express.Router();
const adminController = require("./admin.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const adminMiddleware = require("../../middleware/admin.middleware");
const upload = require("../../middleware/upload");

// Public Admin Auth Routes
router.post("/auth/request-otp", adminController.requestOtp);
router.post("/auth/verify-otp", adminController.verifyOtp);

// Protected Admin Routes (Require valid token + admin role)
router.use(authMiddleware, adminMiddleware);

// Profile
router.get("/auth/me", adminController.getMe);

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Customers / Users Management & Account Approvals
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createCustomer);
router.patch("/users/:id", adminController.updateCustomer);
router.post("/users/:id/approve", adminController.approveAccount);
router.post("/users/:id/reject", adminController.rejectAccount);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteCustomer);
router.patch("/users/:id/role", adminController.updateUserRole);

// Events & Contacts
router.get("/events", adminController.getEvents);
router.patch("/events/:id/access", adminController.updateEventEnabled);
router.patch("/events/:id/status", adminController.updateEventStatus);
router.patch(
  "/events/:id",
  upload.fields([
    { name: "hostOneImage", maxCount: 1 },
    { name: "invitation", maxCount: 1 },
  ]),
  adminController.updateEvent
);
router.delete("/events/:id", adminController.deleteEvent);
router.get("/contacts", adminController.getContacts);

// Configurations
router.get("/whatsapp", adminController.getWhatsApp);
router.get("/firebase", adminController.getFirebase);
router.get("/settings", adminController.getSettings);

module.exports = router;
