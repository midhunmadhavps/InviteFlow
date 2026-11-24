const mongoose = require("mongoose");
const Contact = require("../../models/contact.model");
const Event = require("../../models/event.model");
const Payment = require("../../models/payment.model");
const ScheduleInvite = require("./schedules.model");

const checkEventPaymentApproved = async ({ eventId, userId }) => {
  const payment = await Payment.findOne({
    eventId,
    userId,
    status: "Approved",
  }).select("_id");
  return Boolean(payment);
};

const requireApprovedEventPayment = async ({ eventId, userId }) => {
  if (!(await checkEventPaymentApproved({ eventId, userId }))) {
    const error = new Error(
      "An approved payment is required before scheduling invites for this event."
    );
    error.statusCode = 403;
    throw error;
  }
};

const createScheduleInvites = async ({ eventId, contactIds, scheduledAt, userId }) => {
  const event = await Event.findOne({ _id: eventId, userId }).select("_id");
  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  await requireApprovedEventPayment({ eventId, userId });

  const contacts = await Contact.find({
    _id: { $in: contactIds },
    userId,
  }).select("_id name");
  if (contacts.length !== contactIds.length) {
    const error = new Error("One or more selected contacts are unavailable.");
    error.statusCode = 400;
    throw error;
  }

  const existingInvites = await ScheduleInvite.find({
    eventId,
    contactId: { $in: contactIds },
    scheduledAt,
  }).select("contactId");
  if (existingInvites.length > 0) {
    const duplicateContactIds = new Set(
      existingInvites.map((invite) => invite.contactId.toString())
    );
    const duplicateContacts = contacts
      .filter((contact) => duplicateContactIds.has(contact._id.toString()))
      .map((contact) => ({ id: contact._id, name: contact.name }));
    const names = duplicateContacts.map((contact) => contact.name).join(", ");
    const error = new Error(
      `An invite for ${names} is already scheduled for this event at this time.`
    );
    error.statusCode = 409;
    error.duplicateContacts = duplicateContacts;
    throw error;
  }

  return ScheduleInvite.insertMany(
    contactIds.map((contactId) => ({
      eventId: new mongoose.Types.ObjectId(eventId),
      contactId: new mongoose.Types.ObjectId(contactId),
      scheduledAt,
    }))
  );
};

const getEventPaymentStatus = async ({ eventId, userId }) => {
  const event = await Event.findOne({ _id: eventId, userId }).select("_id");
  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  return checkEventPaymentApproved({ eventId, userId });
};

const getScheduleInvites = async ({ eventId, userId }) => {
  const eventFilter = { userId };
  if (eventId) {
    eventFilter._id = eventId;
  }

  const events = await Event.find(eventFilter).select("_id");
  return ScheduleInvite.find({
    eventId: { $in: events.map((event) => event._id) },
  })
    .populate("eventId", "title eventDate")
    .populate("contactId", "name phoneNumber")
    .sort({ scheduledAt: 1 });
};

const updateScheduleInviteStatus = async ({ scheduleInviteId, isComplete, userId }) => {
  const events = await Event.find({ userId }).select("_id");
  return ScheduleInvite.findOneAndUpdate(
    {
      _id: scheduleInviteId,
      eventId: { $in: events.map((event) => event._id) },
    },
    { $set: { is_complete: isComplete } },
    { new: true, runValidators: true }
  );
};

const deletePendingScheduleInvite = async ({ scheduleInviteId, userId }) => {
  const events = await Event.find({ userId }).select("_id");
  return ScheduleInvite.findOneAndDelete({
    _id: scheduleInviteId,
    eventId: { $in: events.map((event) => event._id) },
    is_complete: { $ne: true },
  });
};

module.exports = {
  checkEventPaymentApproved,
  createScheduleInvites,
  getEventPaymentStatus,
  getScheduleInvites,
  updateScheduleInviteStatus,
  deletePendingScheduleInvite,
};