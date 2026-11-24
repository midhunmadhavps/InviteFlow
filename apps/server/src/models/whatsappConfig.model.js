const mongoose = require("mongoose");

const whatsappConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "default" },
    accessToken: { type: String, default: "" },
    phoneNumberId: { type: String, trim: true, default: "" },
    verifyToken: { type: String, default: "" },
    businessAccountId: { type: String, trim: true, default: "" },
  },
  {
    collection: "whatsapp_config",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("WhatsAppConfig", whatsappConfigSchema);
