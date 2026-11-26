const mongoose = require("mongoose");
const eventService = require("./event.service");
const whatsappService = require("./whatsapp.service");
const paymentGatewayService = require("../payment/paymentGateway.service");
const razorpayService = require("../payment/razorpay.service");

exports.getPaymentGatewayConfig = async (req, res) => {
  try {
    const data = await paymentGatewayService.getPaymentGatewayConfig();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Fetch payment gateway status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment gateway status.",
    });
  }
};

exports.createRazorpayPaymentLink = async (req, res) => {
  try {
    const data = await razorpayService.createPaymentLink({
      eventId: req.body.eventId,
      userId: req.user._id,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to start Razorpay payment.",
    });
  }
};

exports.getRazorpayPaymentStatus = async (req, res) => {
  try {
    const data = await razorpayService.getPaymentStatus({
      eventId: req.query.eventId,
      userId: req.user._id,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to check Razorpay payment status.",
    });
  }
};

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const data = await razorpayService.handleWebhook({
      rawBody: req.rawBody,
      signature: req.headers["x-razorpay-signature"],
      event: req.body,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to process Razorpay webhook.",
    });
  }
};

const createEvent = async (req, res) => {
  try {

    const location = req.body.location
      ? JSON.parse(req.body.location)
      : {};

    const data = {
      eventId: req.eventId,

      userId: req.body.userId,
      eventTypeId: req.body.eventTypeId,

      title: req.body.title,

      hostOne: req.body.hostOne,
      hostTwo: req.body.hostTwo,

      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,

      address: req.body.address,
      location,

      message: req.body.message,

      // IMPORTANT:
      // Store only the filename in MongoDB
      hostOneImage:
        req.files?.hostOneImage?.[0]?.filename || null,

      invitation:
        req.files?.invitation?.[0]?.filename || null,

      reminderDaysBefore:
        req.body.reminderDaysBefore || 1,

      isPublished:
        req.body.isPublished === "true",

      status:
        req.body.status || "Draft",
    };

    const result = await eventService.createEvent(data);

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Create event error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const eventTypes = async (req, res) => {
  try {
    const result = await eventService.eventTypes();

    return res.status(200).json({
      success: true,
      message: "Event Type listed successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Event types error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const eventLists = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await eventService.eventLists(userId);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const events = result.map((event) => {
      const eventData = event.toObject();

      return {
        ...eventData,

        // Convert filename into public URL
        hostOneImage: eventData.hostOneImage
          ? `${baseUrl}/uploads/${eventData.hostOneImage}`
          : null,

        hostTwoImage: eventData.hostTwoImage
          ? `${baseUrl}/uploads/${eventData.hostTwoImage}`
          : null,

        invitation: eventData.invitation
          ? `${baseUrl}/uploads/${eventData.invitation}`
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Events loaded successfully.",
      data: events,
    });
  } catch (error) {
    console.log("Load events error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.eventId;
    delete updateData.userId;
    delete updateData.isEnabled;

    if (updateData.location && typeof updateData.location === "string") {
      try {
        updateData.location = JSON.parse(updateData.location);
      } catch (e) {
        // ignore parse error
      }
    }

    if (req.files?.hostOneImage?.[0]?.filename) {
      updateData.hostOneImage = req.files.hostOneImage[0].filename;
    }

    if (req.files?.invitation?.[0]?.filename) {
      updateData.invitation = req.files.invitation[0].filename;
    }

    const updated = await eventService.updateEvent(id, updateData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const eventData = updated.toObject ? updated.toObject() : updated;

    return res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: {
        ...eventData,
        hostOneImage: eventData.hostOneImage
          ? (eventData.hostOneImage.startsWith("http")
              ? eventData.hostOneImage
              : `${baseUrl}/uploads/${eventData.hostOneImage}`)
          : null,
        hostTwoImage: eventData.hostTwoImage
          ? (eventData.hostTwoImage.startsWith("http")
              ? eventData.hostTwoImage
              : `${baseUrl}/uploads/${eventData.hostTwoImage}`)
          : null,
        invitation: eventData.invitation
          ? (eventData.invitation.startsWith("http")
              ? eventData.invitation
              : `${baseUrl}/uploads/${eventData.invitation}`)
          : null,
      },
    });
  } catch (error) {
    console.log("Update event error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const sendEventInvites = async (req, res) => {
  const { eventId, contactIds } = req.body;
  if (
    !mongoose.Types.ObjectId.isValid(eventId) ||
    !Array.isArray(contactIds) ||
    contactIds.length === 0 ||
    contactIds.length > 100 ||
    contactIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid event and between 1 and 100 contacts are required.",
    });
  }

  try {
    const result = await whatsappService.sendEventInvitations({
      eventId,
      contactIds: [...new Set(contactIds.map(String))],
      userId: req.user._id,
    });

    return res.status(200).json({
      success: result.sentCount > 0,
      message: result.message,
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Send WhatsApp event invites error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send event invitations.",
    });
  }
};

module.exports = {
  createEvent,
  eventTypes,
  eventLists,
  getPaymentGatewayConfig: exports.getPaymentGatewayConfig,
  createRazorpayPaymentLink: exports.createRazorpayPaymentLink,
  getRazorpayPaymentStatus: exports.getRazorpayPaymentStatus,
  handleRazorpayWebhook: exports.handleRazorpayWebhook,
  updateEvent,
  sendEventInvites,
};
