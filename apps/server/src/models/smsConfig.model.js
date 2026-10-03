const mongoose = require("mongoose");

const smsConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    provider: { type: String, trim: true, default: "" },
    api_url: { type: String, trim: true, default: "" },
    api_key: { type: String, default: "" },
    api_secret: { type: String, default: "" },
    sender_id: { type: String, trim: true, default: "" },
    host: { type: String, trim: true, default: "" },
    port: { type: Number, min: 1, max: 65535, default: null },
    username: { type: String, trim: true, default: "" },
    password: { type: String, default: "" },
    is_active: { type: Boolean, default: false },
  },
  {
    collection: "sms_config",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("SmsConfig", smsConfigSchema);
