const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      min: 1,
      default: null,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "INR",
    },
    provider: {
      type: String,
      enum: ["razorpay", "manual"],
      default: "manual",
    },
    razorpayPaymentLinkId: {
      type: String,
      default: "",
      index: true,
    },
    razorpayPaymentUrl: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
      index: true,
    },
  },
  {
    collection: "payments",
    timestamps: true,
  }
);

paymentSchema.index({ eventId: 1, userId: 1, status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
