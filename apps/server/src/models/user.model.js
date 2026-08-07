const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
      maxlength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      sparse: true,
    },

    password: {
      type: String,
      default: null,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Pending", "Active", "Blocked"],
      default: "Pending",
    },

    lastLogin: {
      type: Date,
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);