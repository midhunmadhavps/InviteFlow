const mongoose = require("mongoose");

const emailConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    provider: { type: String, trim: true, default: "" },
    host: { type: String, trim: true, default: "" },
    port: { type: Number, min: 1, max: 65535, default: null },
    username: { type: String, trim: true, default: "" },
    password: { type: String, default: "" },
    api_key: { type: String, default: "" },
    from_email: { type: String, trim: true, lowercase: true, default: "" },
    from_name: { type: String, trim: true, default: "" },
    encryption: { type: String, trim: true, default: "" },
    is_active: { type: Boolean, default: false },
  },
  {
    collection: "email_config",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("EmailConfig", emailConfigSchema);
