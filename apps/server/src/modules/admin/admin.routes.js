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
router.patch("/users/:id/access", adminController.updateUserAccess);
router.delete("/users/:id", adminController.deleteCustomer);
router.patch("/users/:id/role", adminController.updateUserRole);

// Events & Contacts
router.get("/events/types", adminController.getEventTypes);
router.get("/events", adminController.getEvents);
router.post(
  "/events",
  upload.fields([
    { name: "hostOneImage", maxCount: 1 },
    { name: "invitation", maxCount: 1 },
  ]),
  adminController.createEvent
);
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
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.saveSettings);
router.get("/system-config", adminController.getSystemConfig);
router.put(
  "/system-config",
  (req, res, next) => {
    upload.logo.single("logo")(req, res, (error) => {
      if (error) {
        const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(statusCode).json({ success: false, message: error.message });
      }
      next();
    });
  },
  adminController.saveSystemConfig
);
router.get("/config/email", adminController.getEmailConfig);
router.put("/config/email", adminController.saveEmailConfig);
router.get("/config/sms", adminController.getSmsConfig);
router.put("/config/sms", adminController.saveSmsConfig);

module.exports = router;
