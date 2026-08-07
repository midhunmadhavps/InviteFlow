const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  eventTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventType",
    required: true,
  },

  title: {
    type: String,
    required: true,
    trim: true,
  },

  hostOne: {
    type: String,
    required: true,
    trim: true,
  },

  hostTwo: {
    type: String,
    default: "",
    trim: true,
  },

  eventDate: {
    type: Date,
    required: true,
  },

  eventTime: {
    type: String,
    default: "",
  },

  venue: {
    street1: String,
    street2: String,
    district: String,
    state: String,
    postcode: String,
    country: {
      type: String,
      default: "India",
    },
  },

  invitationImage: {
    type: String,
    default: null,
  },

  message: {
    type: String,
    default: "",
  },

  reminderDaysBefore: {
    type: Number,
    default: 1,
  },

  isPublished: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["Draft", "Published", "Completed", "Cancelled"],
    default: "Draft",
  },
},
{
  timestamps: true,
});


module.exports = mongoose.model("Event", eventSchema);