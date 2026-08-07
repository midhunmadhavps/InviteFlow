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
    },

    hostOne: {
      type: String,
      required: true,
    },

    hostTwo: {
      type: String,
      default: "",
    },

    eventDate: {
      type: Date,
      required: true,
    },

    eventTime: {
      type: String,
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

    invitationImage: String,

    message: String,

    status: {
      type: String,
      enum: ["Draft", "Scheduled", "Completed", "Cancelled"],
      default: "Draft",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);