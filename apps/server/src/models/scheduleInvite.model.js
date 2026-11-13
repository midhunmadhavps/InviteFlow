const mongoose = require("mongoose");

const scheduleInviteSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    is_complete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "schedule_invite",
  }
);

module.exports = mongoose.model("ScheduleInvite", scheduleInviteSchema);
