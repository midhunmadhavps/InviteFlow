const mongoose = require("mongoose");

const paymentGatewayConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    enabled: { type: Boolean, default: false, required: true },
    razorpayKeyId: { type: String, default: "" },
    razorpayKeySecret: { type: String, default: "" },
    razorpayWebhookSecret: { type: String, default: "" },
    phonepeClientId: { type: String, default: "" },
    phonepeClientSecret: { type: String, default: "" },
    phonepeClientVersion: { type: String, trim: true, default: "1" },
    phonepeWebhookUsername: { type: String, default: "" },
    phonepeWebhookPassword: { type: String, default: "" },
    paypalClientId: { type: String, default: "" },
    paypalClientSecret: { type: String, default: "" },
    paypalWebhookId: { type: String, default: "" },
    paypalEnvironment: {
      type: String,
      enum: ["sandbox", "live"],
      default: "sandbox",
    },
    providerEnabled: {
      razorpay: { type: Boolean, default: false },
      phonepe: { type: Boolean, default: false },
      paypal: { type: Boolean, default: false },
    },
    primaryProvider: {
      type: String,
      enum: ["razorpay", "phonepe", "paypal", null],
      default: null,
    },
  },
  {
    collection: "payment_gateway_config",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model(
  "PaymentGatewayConfig",
  paymentGatewayConfigSchema
);
