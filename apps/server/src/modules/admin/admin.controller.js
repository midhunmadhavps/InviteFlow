const adminService = require("./admin.service");

const handleError = (res, error, defaultMessage = "Server error occurred.") => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
  });
};

/**
 * Request Admin OTP
 */
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    const result = await adminService.requestAdminOtp({ email, clientIp });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to send admin OTP.");
  }
};

/**
 * Verify Admin OTP
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    const result = await adminService.verifyAdminOtp({ email, otp, clientIp });

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful.",
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to verify admin OTP.");
  }
};

/**
 * Get current admin profile
 */
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        status: req.user.status,
      },
    });
  } catch (error) {
    return handleError(res, error, "Failed to get admin profile.");
  }
};

/**
 * Get Dashboard Stats
 */
exports.getDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch dashboard statistics.");
  }
};

/**
 * Customers / Users List
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search, page, limit } = req.query;
    const result = await adminService.getUsers({ role, status, search, page, limit });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch users.");
  }
};

/**
 * Create a customer account
 */
exports.createCustomer = async (req, res) => {
  try {
    const result = await adminService.createCustomer(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to register customer.");
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const result = await adminService.updateCustomer(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to update customer.");
  }
};

/**
 * Approve Account
 */
exports.approveAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await adminService.approveAccount(id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to approve account.");
  }
};

/**
 * Reject Account
 */
exports.rejectAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const result = await adminService.rejectAccount(id, reason);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to reject account.");
  }
};

/**
 * Update User Status
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await adminService.updateUserStatus(id, status);
    return res.status(200).json({
      success: true,
      message: "User status updated successfully.",
      data: user,
    });
  } catch (error) {
    return handleError(res, error, "Failed to update user status.");
  }
};

exports.updateUserAccess = async (req, res) => {
  try {
    const user = await adminService.updateUserAccess(
      req.params.id,
      req.body.isEnabled
    );
    return res.status(200).json({
      success: true,
      message: `Customer access ${req.body.isEnabled ? "enabled" : "disabled"} successfully.`,
      data: user,
    });
  } catch (error) {
    return handleError(res, error, "Failed to update customer access.");
  }
};

/**
 * Delete a customer account and its associated data
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const result = await adminService.deleteCustomer(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to delete customer.");
  }
};

/**
 * Update User Role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await adminService.updateUserRole(id, role);
    return res.status(200).json({
      success: true,
      message: "User role updated successfully.",
      data: user,
    });
  } catch (error) {
    return handleError(res, error, "Failed to update user role.");
  }
};

/**
 * Events
 */
exports.getEventTypes = async (req, res) => {
  try {
    const eventTypes = await adminService.getEventTypes();
    return res.status(200).json({ success: true, data: eventTypes });
  } catch (error) {
    return handleError(res, error, "Failed to fetch event types.");
  }
};

exports.createEvent = async (req, res) => {
  try {
    const result = await adminService.createEvent({
      ...req.body,
      hostOneImage: req.files?.hostOneImage?.[0]?.filename || null,
      invitation: req.files?.invitation?.[0]?.filename || null,
    });
    return res.status(201).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to create event.");
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await adminService.getEvents({ search, page, limit });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch events.");
  }
};

exports.updateEventEnabled = async (req, res) => {
  try {
    const result = await adminService.updateEventEnabled(
      req.params.id,
      req.body.isEnabled
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to update event access.");
  }
};

exports.updateEventStatus = async (req, res) => {
  try {
    const result = await adminService.updateEventStatus(
      req.params.id,
      req.body.status
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to update event status.");
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.hostOneImage;
    delete updateData.invitation;

    if (updateData.location && typeof updateData.location === "string") {
      updateData.location = JSON.parse(updateData.location);
    }

    if (req.files?.hostOneImage?.[0]?.filename) {
      updateData.hostOneImage = req.files.hostOneImage[0].filename;
    }
    if (req.files?.invitation?.[0]?.filename) {
      updateData.invitation = req.files.invitation[0].filename;
    }

    const result = await adminService.updateEvent(req.params.id, updateData);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to update event.");
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const result = await adminService.deleteEvent(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Failed to delete event.");
  }
};

/**
 * Contacts
 */
exports.getContacts = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await adminService.getContacts({ search, page, limit });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch contacts.");
  }
};

/**
 * Configurations - WhatsApp
 */
exports.getWhatsApp = async (req, res) => {
  try {
    const data = await adminService.getWhatsAppDetails();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch WhatsApp configuration.");
  }
};

/**
 * Configurations - Settings
 */
exports.getSettings = async (req, res) => {
  try {
    const data = await adminService.getSettings();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch settings.");
  }
};

exports.saveSettings = async (req, res) => {
  try {
    const data = await adminService.saveSettings(req.body);
    return res.status(200).json({
      success: true,
      message: "Settings saved successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error, "Failed to save settings.");
  }
};

exports.getSystemConfig = async (req, res) => {
  try {
    const config = await adminService.getSystemConfig();
    return res.status(200).json({ success: true, data: config });
  } catch (error) {
    return handleError(res, error, "Failed to fetch system details.");
  }
};

exports.saveSystemConfig = async (req, res) => {
  try {
    const config = await adminService.saveSystemConfig(
      req.body,
      req.file?.filename
    );
    return res.status(200).json({
      success: true,
      message: "System details saved successfully.",
      data: config,
    });
  } catch (error) {
    return handleError(res, error, "Failed to save system details.");
  }
};

exports.getEmailConfig = async (req, res) => {
  try {
    const data = await adminService.getEmailConfig();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error, "Failed to fetch email configuration.");
  }
};

exports.saveEmailConfig = async (req, res) => {
  try {
    const data = await adminService.saveEmailConfig(req.body);
    return res.status(200).json({
      success: true,
      message: "Email configuration saved successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error, "Failed to save email configuration.");
  }
};

exports.getSmsConfig = async (req, res) => {
  try {
    const data = await adminService.getSmsConfig();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(res, error, "Failed to fetch SMS configuration.");
  }
};

exports.saveSmsConfig = async (req, res) => {
  try {
    const data = await adminService.saveSmsConfig(req.body);
    return res.status(200).json({
      success: true,
      message: "SMS configuration saved successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error, "Failed to save SMS configuration.");
  }
};
