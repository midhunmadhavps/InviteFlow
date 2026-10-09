const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");
const Event = require("../../models/event.model");
const Contact = require("../../models/contact.model");
const EventType = require("../../models/eventType.model");
const eventService = require("../events/event.service");
const EmailConfig = require("../../models/emailConfig.model");
const SmsConfig = require("../../models/smsConfig.model");
const SystemConfig = require("../../models/systemConfig.model");
const { createUsername } = require("../users/user.utils");

// In-memory rate limiting map for OTP requests and verification attempts
const otpRequestRateLimits = new Map();
const otpVerifyAttemptLimits = new Map();

// Helper to mask strings (e.g., phone, IDs, tokens)
const maskString = (str, visibleStart = 2, visibleEnd = 4) => {
  if (!str) return "Not Configured";
  const s = String(str);
  if (s.length <= visibleStart + visibleEnd) return "****";
  const start = s.substring(0, visibleStart);
  const end = s.substring(s.length - visibleEnd);
  return `${start}${"*".repeat(s.length - visibleStart - visibleEnd)}${end}`;
};

/**
 * 1. Request Admin Login OTP
 */
exports.requestAdminOtp = async ({ email, clientIp = "default" }) => {
  if (!email) {
    throw new Error("Email address is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Find user by email
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error("No account found with this email address.");
    error.statusCode = 404;
    throw error;
  }

  // Deny if user is not an administrator
  if (user.role !== "admin") {
    const error = new Error("Access denied. Administrator privileges required.");
    error.statusCode = 403;
    throw error;
  }

  // Rate limiting check: Max 5 requests per 10 minutes per email/IP
  const rateKey = `${normalizedEmail}_${clientIp}`;
  const now = Date.now();
  const requestHistory = (otpRequestRateLimits.get(rateKey) || []).filter(
    (timestamp) => now - timestamp < 10 * 60 * 1000
  );

  if (requestHistory.length >= 5) {
    const error = new Error("Too many OTP requests. Please try again in 10 minutes.");
    error.statusCode = 429;
    throw error;
  }

  requestHistory.push(now);
  otpRequestRateLimits.set(rateKey, requestHistory);

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  console.log(`Generated OTP for ${normalizedEmail}: ${rawOtp}`);
  // const rawOtp = crypto.randomInt(100000, 1000000).toString();

  // Hash the OTP with bcrypt for secure storage
  const hashedOtp = await bcrypt.hash(rawOtp, 10);

  // OTP expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Store in database with purpose ADMIN_LOGIN
  await Otp.findOneAndUpdate(
    { phone: user.phone, purpose: "ADMIN_LOGIN" },
    {
      phone: user.phone,
      purpose: "ADMIN_LOGIN",
      otp: hashedOtp,
      expiresAt,
      verified: false,
    },
    { upsert: true, new: true }
  );

  // In non-production environments, log for local development verification
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV ONLY] Admin Login OTP for ${normalizedEmail}: ${rawOtp}`);
  }

  // Reset verify attempt counter for this user
  otpVerifyAttemptLimits.delete(normalizedEmail);

  return {
    success: true,
    message: "OTP sent to your registered mobile number",
  };
};

/**
 * 2. Verify Admin Login OTP
 */
exports.verifyAdminOtp = async ({ email, otp, clientIp = "default" }) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error("No account found with this email address.");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "admin") {
    const error = new Error("Access denied. Administrator privileges required.");
    error.statusCode = 403;
    throw error;
  }

  // Rate limit verification attempts (max 5 failed attempts per OTP)
  const attempts = otpVerifyAttemptLimits.get(normalizedEmail) || 0;
  if (attempts >= 5) {
    // Delete OTP on too many failed attempts
    await Otp.deleteOne({ phone: user.phone, purpose: "ADMIN_LOGIN" });
    otpVerifyAttemptLimits.delete(normalizedEmail);
    const error = new Error("Too many failed attempts. OTP has been invalidated. Please request a new OTP.");
    error.statusCode = 429;
    throw error;
  }

  // Find OTP record
  const otpRecord = await Otp.findOne({
    phone: user.phone,
    purpose: "ADMIN_LOGIN",
  });

  if (!otpRecord) {
    const error = new Error("OTP not found or has already been used. Please request a new OTP.");
    error.statusCode = 400;
    throw error;
  }

  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    const error = new Error("OTP has expired. Please request a new OTP.");
    error.statusCode = 400;
    throw error;
  }

  // Check OTP match (handles bcrypt hash or legacy string match)
  let isMatch = false;
  if (otpRecord.otp.startsWith("$2a$") || otpRecord.otp.startsWith("$2b$")) {
    isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.otp);
  } else {
    isMatch = otpRecord.otp === otp.toString().trim();
  }

  if (!isMatch) {
    otpVerifyAttemptLimits.set(normalizedEmail, attempts + 1);
    const error = new Error("Invalid OTP. Please check and try again.");
    error.statusCode = 400;
    throw error;
  }

  // Single-use: Delete the OTP record immediately
  await Otp.deleteOne({ _id: otpRecord._id });
  otpVerifyAttemptLimits.delete(normalizedEmail);

  // Update admin user last login
  user.lastLogin = new Date();
  user.isEmailVerified = true;
  user.isPhoneVerified = true;
  await user.save();

  // Generate JWT token with role information
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return {
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  };
};

/**
 * 3. Dashboard Summary
 */
exports.getDashboardStats = async () => {
  const [
    totalUsers,
    pendingAccounts,
    approvedAccounts,
    totalEvents,
    recentUsers,
    recentEvents,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ status: "Pending", role: "customer" }),
    User.countDocuments({ status: "Active", role: "customer" }),
    Event.countDocuments(),
    User.find({ role: "customer" }).sort({ createdAt: -1 }).limit(5).select("-password"),
    Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "firstName lastName email phone")
      .populate("eventTypeId", "name icon"),
  ]);

  const whatsappConfigured = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);

  return {
    totalUsers,
    pendingAccounts,
    approvedAccounts,
    totalEvents,
    whatsappAccounts: whatsappConfigured ? 1 : 0,
    recentUsers,
    recentEvents,
  };
};

/**
 * 4. Customers / Users List & Management
 */
exports.getUsers = async ({ role, status, search, page = 1, limit = 10 }) => {
  const query = {};

  if (role && role !== "All") {
    query.role = role;
  }

  if (status && status !== "All") {
    query.status = status;
  }

  if (search) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex },
      { username: regex },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  return {
    users,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

exports.createCustomer = async ({
  firstName,
  lastName,
  email,
  phone,
  setDefaultPassword = false,
}) => {
  const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

  if (!/^[A-Za-z\s]+$/.test(normalizedFirstName) || normalizedFirstName.length > 50) {
    const error = new Error("Please enter a valid first name.");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[A-Za-z\s]+$/.test(normalizedLastName) || normalizedLastName.length > 50) {
    const error = new Error("Please enter a valid last name.");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error("Please enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    const error = new Error("Please enter a valid 10-digit phone number.");
    error.statusCode = 400;
    throw error;
  }

  if (typeof setDefaultPassword !== "boolean") {
    const error = new Error("Default password selection must be true or false.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({
    $or: [{ phone: normalizedPhone }, { email: normalizedEmail }],
  });

  if (existingUser) {
    const error = new Error(
      existingUser.phone === normalizedPhone
        ? "Phone number already registered."
        : "Email already registered."
    );
    error.statusCode = 409;
    throw error;
  }

  const password = setDefaultPassword ? await bcrypt.hash("Admin@123", 10) : null;
  const username = await createUsername(normalizedFirstName, normalizedLastName);
  const user = await User.create({
    username,
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password,
    isPhoneVerified: true,
    isEmailVerified: true,
    status: "Active",
    role: "customer",
  });

  return {
    success: true,
    message: "Customer registered successfully.",
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
};

exports.updateCustomer = async (userId, data) => {
  const { firstName, lastName, email, phone, password, confirmPassword } = data;
  const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

  if (!/^[A-Za-z\s]+$/.test(normalizedFirstName) || normalizedFirstName.length > 50) {
    const error = new Error("Please enter a valid first name.");
    error.statusCode = 400;
    throw error;
  }
  if (!/^[A-Za-z\s]+$/.test(normalizedLastName) || normalizedLastName.length > 50) {
    const error = new Error("Please enter a valid last name.");
    error.statusCode = 400;
    throw error;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error("Please enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }
  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
    const error = new Error("Please enter a valid 10-digit phone number.");
    error.statusCode = 400;
    throw error;
  }
  if (password || confirmPassword) {
    if (password !== confirmPassword) {
      const error = new Error("Passwords do not match.");
      error.statusCode = 400;
      throw error;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[@$!%*?&]/.test(password)
    ) {
      const error = new Error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      error.statusCode = 400;
      throw error;
    }
  }

  const user = await User.findOne({ _id: userId, role: "customer" });
  if (!user) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  const conflictingUser = await User.findOne({
    _id: { $ne: user._id },
    $or: [{ phone: normalizedPhone }, { email: normalizedEmail }],
  });
  if (conflictingUser) {
    const error = new Error(
      conflictingUser.phone === normalizedPhone
        ? "Phone number already registered."
        : "Email already registered."
    );
    error.statusCode = 409;
    throw error;
  }

  user.firstName = normalizedFirstName;
  user.lastName = normalizedLastName;
  user.email = normalizedEmail;
  user.phone = normalizedPhone;
  user.username = await createUsername(normalizedFirstName, normalizedLastName, user._id);
  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }
  await user.save();

  return {
    success: true,
    message: "Customer updated successfully.",
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      isPhoneVerified: user.isPhoneVerified,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      role: user.role,
    },
  };
};

/**
 * 5. Approve Customer Account
 */
exports.approveAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  user.status = "Active";
  user.isPhoneVerified = true;
  user.isEmailVerified = true;
  await user.save();

  return {
    success: true,
    message: `Account for ${user.firstName} ${user.lastName} has been approved.`,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: user.role,
    },
  };
};

/**
 * 6. Reject / Block Customer Account
 */
exports.rejectAccount = async (userId, reason = "") => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  user.status = "Blocked";
  await user.save();

  return {
    success: true,
    message: `Account for ${user.firstName} ${user.lastName} has been blocked/rejected.`,
    user: {
      id: user._id,
      status: user.status,
      reason,
    },
  };
};

exports.updateUserStatus = async (userId, newStatus) => {
  if (!["Active", "Pending", "Blocked"].includes(newStatus)) {
    throw new Error("Invalid status. Allowed: Active, Pending, Blocked");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { status: newStatus },
    { new: true }
  ).select("-password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

exports.updateUserAccess = async (userId, isEnabled) => {
  if (typeof isEnabled !== "boolean") {
    const error = new Error("Customer access must be enabled or disabled.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOneAndUpdate(
    { _id: userId, role: "customer" },
    { isEnabled },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

exports.deleteCustomer = async (userId) => {
  const user = await User.findOne({ _id: userId, role: "customer" });
  if (!user) {
    const error = new Error("Customer not found.");
    error.statusCode = 404;
    throw error;
  }

  await Promise.all([
    Event.deleteMany({ userId: user._id }),
    Contact.deleteMany({ userId: user._id }),
    Otp.deleteMany({ phone: user.phone }),
  ]);

  await user.deleteOne();

  return {
    success: true,
    message: `Customer account for ${user.firstName} ${user.lastName} has been deleted.`,
  };
};

exports.updateUserRole = async (userId, newRole) => {
  if (!["customer", "admin"].includes(newRole)) {
    throw new Error("Invalid role. Allowed: customer, admin");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role: newRole },
    { new: true }
  ).select("-password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * 7. Events List for Admin
 */
exports.getEventTypes = async () => EventType.find({ isActive: true }).sort({ name: 1 });

exports.createEvent = async (eventData) => {
  if (!mongoose.Types.ObjectId.isValid(eventData.customerId)) {
    const error = new Error("Select a valid customer for this event.");
    error.statusCode = 400;
    throw error;
  }

  const customer = await User.findOne({
    _id: eventData.customerId,
    role: "customer",
    status: "Active",
    isEnabled: { $ne: false },
  });
  if (!customer) {
    const error = new Error("The selected customer is not active or available.");
    error.statusCode = 400;
    throw error;
  }

  const eventType = await EventType.findOne({
    _id: eventData.eventTypeId,
    isActive: true,
  });
  if (!eventType) {
    const error = new Error("Select a valid, active event type.");
    error.statusCode = 400;
    throw error;
  }

  if (
    !eventData.title?.trim() ||
    !eventData.hostOne?.trim() ||
    !eventData.eventDate ||
    !eventData.eventTime ||
    !eventData.address?.trim() ||
    !eventData.hostOneImage
  ) {
    const error = new Error("Title, host, date, time, event address, and host photo are required.");
    error.statusCode = 400;
    throw error;
  }

  let location = {};
  try {
    location = typeof eventData.location === "string"
      ? JSON.parse(eventData.location)
      : eventData.location || {};
  } catch (parseError) {
    const error = new Error("Event location must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }

  let mapUrl;
  try {
    mapUrl = new URL(location.googleMapsUrl);
  } catch (parseError) {
    const error = new Error("A valid Google Maps URL is required for the event location.");
    error.statusCode = 400;
    throw error;
  }
  if (mapUrl.protocol !== "http:" && mapUrl.protocol !== "https:") {
    const error = new Error("Event location must be an HTTP or HTTPS Google Maps URL.");
    error.statusCode = 400;
    throw error;
  }
  if (
    ["Wedding", "Anniversary", "Engagement"].includes(eventType.name) &&
    !eventData.hostTwo?.trim()
  ) {
    const error = new Error("A second host is required for this event type.");
    error.statusCode = 400;
    throw error;
  }

  const event = await eventService.createEvent({
    userId: customer._id,
    eventTypeId: eventType._id,
    title: eventData.title.trim(),
    hostOne: eventData.hostOne.trim(),
    hostTwo: eventData.hostTwo?.trim() || "",
    eventDate: eventData.eventDate,
    eventTime: eventData.eventTime,
    address: eventData.address.trim(),
    location,
    message: eventData.message || "",
    hostOneImage: eventData.hostOneImage,
    invitation: eventData.invitation,
    isPublished: false,
    status: "Draft",
  });

  return {
    success: true,
    message: "Event created successfully.",
    data: event,
  };
};

exports.getEvents = async ({ search, page = 1, limit = 10 }) => {
  const query = {};

  if (search) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ title: regex }, { eventId: regex }, { hostOne: regex }, { hostTwo: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [events, total] = await Promise.all([
    Event.find(query)
      .populate("userId", "firstName lastName email phone")
      .populate("eventTypeId", "name icon")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Event.countDocuments(query),
  ]);

  return {
    events,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

exports.updateEventEnabled = async (eventId, isEnabled) => {
  if (typeof isEnabled !== "boolean") {
    const error = new Error("Event access must be enabled or disabled.");
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.findByIdAndUpdate(
    eventId,
    { isEnabled },
    { new: true, runValidators: true }
  );

  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    message: `Event ${isEnabled ? "enabled" : "disabled"} successfully.`,
    data: event,
  };
};

exports.updateEventStatus = async (eventId, status) => {
  const allowedStatuses = ["Draft", "Active", "Completed", "Cancelled"];
  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid event status.");
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.findByIdAndUpdate(
    eventId,
    { status },
    { new: true, runValidators: true }
  );

  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    message: "Event status updated successfully.",
    data: event,
  };
};

exports.updateEvent = async (eventId, eventData) => {
  const allowedFields = [
    "title",
    "status",
    "hostOne",
    "hostTwo",
    "eventDate",
    "eventTime",
    "address",
    "location",
    "message",
    "hostOneImage",
    "invitation",
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(eventData, field)) {
      updateData[field] = eventData[field];
    }
  });

  if (!Object.keys(updateData).length) {
    const error = new Error("No event fields provided to update.");
    error.statusCode = 400;
    throw error;
  }

  const event = await Event.findByIdAndUpdate(
    eventId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName email phone")
    .populate("eventTypeId", "name icon");

  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    message: "Event updated successfully.",
    data: event,
  };
};

exports.deleteEvent = async (eventId) => {
  const event = await Event.findByIdAndDelete(eventId);
  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  return {
    success: true,
    message: `Event "${event.title}" deleted successfully.`,
  };
};

/**
 * 8. Contacts List for Admin
 */
exports.getContacts = async ({ search, page = 1, limit = 10 }) => {
  const query = {};

  if (search) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [contacts, total] = await Promise.all([
    Contact.find(query)
      .populate("userId", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Contact.countDocuments(query),
  ]);

  return {
    contacts,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * 9. Configurations (WhatsApp Details)
 */
exports.getWhatsAppDetails = async () => {
  const hasToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  return {
    status: hasToken ? "Connected" : "Not Configured",
    phoneNumberId: maskString(phoneNumberId, 2, 4),
    businessAccountId: maskString(businessAccountId, 2, 4),
    verifyTokenConfigured: Boolean(verifyToken),
    accessTokenConfigured: hasToken,
    environment: process.env.NODE_ENV || "development",
    lastSync: new Date(),
    health: hasToken ? "Operational" : "Configuration Incomplete",
    features: [
      { name: "Invitation Broadcast", enabled: hasToken },
      { name: "Automated RSVP Responses", enabled: hasToken },
      { name: "Event Reminders", enabled: hasToken },
      { name: "Media Delivery (Images/PDFs)", enabled: Boolean(process.env.CLOUDINARY_CLOUD_NAME) },
    ],
  };
};

/**
 * 11. Configurations (Settings)
 */
exports.getSettings = async () => {
  const config = await SystemConfig.findById("default").lean();
  return {
    appName: "InviteFlow Admin",
    version: "1.0.0",
    supportEmail: "support@inviteflow.com",
    autoApproveCustomers: false,
    otpExpiryMinutes: 5,
    maxLoginAttempts: 5,
    maintenanceMode: false,
    allowRegistration: config?.allowRegistration ?? true,
  };
};

exports.saveSettings = async (input) => {
  if (typeof input?.allowRegistration !== "boolean") {
    const error = new Error("allowRegistration must be a boolean.");
    error.statusCode = 400;
    throw error;
  }

  const config = await SystemConfig.findByIdAndUpdate(
    "default",
    { $set: { allowRegistration: input.allowRegistration } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return { allowRegistration: config.allowRegistration };
};

const EMPTY_SYSTEM_CONFIG = {
  name: "",
  email: "",
  phone: "",
  address: "",
  logo: "",
};

exports.getSystemConfig = async () => {
  const config = await SystemConfig.findById("default").lean();
  if (!config) return EMPTY_SYSTEM_CONFIG;
  return {
    name: config.name,
    email: config.email,
    phone: config.phone,
    address: config.address,
    logo: config.logo,
  };
};

exports.saveSystemConfig = async (input, logo) => {
  const update = {};
  ["name", "email", "phone", "address"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      if (typeof input[field] !== "string") {
        const error = new Error(`${field} must be a string.`);
        error.statusCode = 400;
        throw error;
      }
      update[field] = input[field].trim();
    }
  });

  if (update.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email)) {
    const error = new Error("Enter a valid system email address.");
    error.statusCode = 400;
    throw error;
  }
  if (logo) update.logo = logo;
  if (!Object.keys(update).length) {
    const error = new Error("Provide system details or a logo to save.");
    error.statusCode = 400;
    throw error;
  }

  await SystemConfig.findByIdAndUpdate(
    "default",
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return exports.getSystemConfig();
};

const adminConfigFields = {
  email: {
    model: EmailConfig,
    secrets: ["password", "api_key"],
    allowed: ["provider", "host", "port", "username", "password", "api_key", "from_email", "from_name", "encryption", "is_active"],
  },
  sms: {
    model: SmsConfig,
    secrets: ["password", "api_key", "api_secret"],
    allowed: ["provider", "api_url", "api_key", "api_secret", "sender_id", "host", "port", "username", "password", "is_active"],
  },
};

const getAdminConfig = async (type) => {
  const { model: Model, secrets } = adminConfigFields[type];
  const config = await Model.findById("default").lean();
  const configuredSecrets = Object.fromEntries(secrets.map((field) => [
    field,
    Boolean(config?.[field]),
  ]));

  if (config) {
    secrets.forEach((field) => delete config[field]);
  }

  return { config, configuredSecrets };
};

const saveAdminConfig = async (type, input) => {
  const { model: Model, secrets, allowed } = adminConfigFields[type];
  const update = {};
  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      update[field] = input[field];
    }
  });

  if (Object.prototype.hasOwnProperty.call(update, "port")) {
    if (update.port === "" || update.port === null) {
      update.port = null;
    } else {
      const port = Number(update.port);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        const error = new Error("Port must be a whole number between 1 and 65535.");
        error.statusCode = 400;
        throw error;
      }
      update.port = port;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(update, "is_active") &&
    typeof update.is_active !== "boolean"
  ) {
    const error = new Error("is_active must be true or false.");
    error.statusCode = 400;
    throw error;
  }

  secrets.forEach((field) => {
    if (typeof update[field] === "string" && !update[field].trim()) {
      delete update[field];
    }
  });

  if (!Object.keys(update).length) {
    const error = new Error("Provide at least one configuration value to save.");
    error.statusCode = 400;
    throw error;
  }

  await Model.findByIdAndUpdate(
    "default",
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return getAdminConfig(type);
};

exports.getEmailConfig = () => getAdminConfig("email");
exports.saveEmailConfig = (input) => saveAdminConfig("email", input);
exports.getSmsConfig = () => getAdminConfig("sms");
exports.saveSmsConfig = (input) => saveAdminConfig("sms", input);
