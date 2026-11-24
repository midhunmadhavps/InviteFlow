const crypto = require("crypto");
const WhatsAppConfig = require("../models/whatsappConfig.model");

const getEncryptionKey = () => {
  const secret =
    process.env.WHATSAPP_CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error(
      "Set WHATSAPP_CONFIG_ENCRYPTION_KEY or JWT_SECRET to encrypt WhatsApp credentials."
    );
    error.statusCode = 503;
    throw error;
  }
  return crypto.createHash("sha256").update(secret).digest();
};

const encryptSecret = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "enc:v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

const decryptSecret = (value) => {
  if (!value) return "";
  const [prefix, version, ivValue, tagValue, encryptedValue] = value.split(":");
  if (
    prefix !== "enc" ||
    version !== "v1" ||
    !ivValue ||
    !tagValue ||
    !encryptedValue
  ) {
    const error = new Error("Stored WhatsApp credentials have an invalid format.");
    error.statusCode = 500;
    throw error;
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final(),
  ]).toString("utf8");
};

const getWhatsAppConfig = async () => {
  const config = await WhatsAppConfig.findById("default").lean();
  if (!config) return null;
  return {
    ...config,
    accessToken: decryptSecret(config.accessToken),
    verifyToken: decryptSecret(config.verifyToken),
  };
};

module.exports = {
  decryptSecret,
  encryptSecret,
  getWhatsAppConfig,
};
