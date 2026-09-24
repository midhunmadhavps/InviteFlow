const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Store complete contact details as JSON (name, phone numbers, emails, etc.)
    contactDetails: {
      type: Object,
      required: true,
    },

    // Extracted fields for easier querying and indexing
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for user + phone number to prevent duplicates
contactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);