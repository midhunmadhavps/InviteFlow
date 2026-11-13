const mongoose = require("mongoose");
const Contact = require("../../models/contact.model");
const Event = require("../../models/event.model");
const ScheduleInvite = require("./schedules.model");

const createScheduleInvites = async ({ eventId, contactIds, scheduledAt, userId }) => {
  const event = await Event.findOne({ _id: eventId, userId }).select("_id");
  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }

  const contacts = await Contact.find({
    _id: { $in: contactIds },
    userId,
  }).select("_id");
  if (contacts.length !== contactIds.length) {
    const error = new Error("One or more selected contacts are unavailable.");
    error.statusCode = 400;
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

module.exports = { createScheduleInvites };