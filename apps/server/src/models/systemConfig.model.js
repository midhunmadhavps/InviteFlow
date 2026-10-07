const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    logo: { type: String, trim: true, default: "" },
  },
  {
    collection: "system_config",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("SystemConfig", systemConfigSchema);
