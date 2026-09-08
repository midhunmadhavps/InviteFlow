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

    hostOneImage: {
      type: String,
      default: null,
    },

    hostTwoImage: {
      type: String,
      default: null,
    },

    eventDate: {
      type: Date,
      required: true,
    },

    eventTime: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      address: {
        type: String,
        default: "",
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      googleMapsUrl: {
        type: String,
        default: "",
      },
    },

    invitation: {
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
      enum: [
        "Draft",
        "Published",
        "Completed",
        "Cancelled",
      ],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);