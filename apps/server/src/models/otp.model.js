const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },

    purpose: {
      type: String,
      enum: ["REGISTER", "FORGOT_PASSWORD", "ADMIN_LOGIN", "USER_LOGIN", "LOGIN"],
      required: true
    },

    otp: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    verified: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Automatically remove expired OTPs
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("Otp", otpSchema);