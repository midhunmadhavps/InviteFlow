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
 * Configurations - Firebase
 */
exports.getFirebase = async (req, res) => {
  try {
    const data = await adminService.getFirebaseDetails();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch Firebase details.");
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
