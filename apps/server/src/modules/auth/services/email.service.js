const nodemailer = require("nodemailer");
const EmailConfig = require("../../../models/emailConfig.model");

const createServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

exports.sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw createServiceError("Recipient, subject, and email content are required.", 400);
  }

  const config = await EmailConfig.findById("default").lean();
  if (!config?.is_active) {
    throw createServiceError("Email delivery is not configured or enabled.", 503);
  }
  if (!config.host || !config.port || !config.from_email) {
    throw createServiceError("Email SMTP settings are incomplete.", 503);
  }

  const encryption = (config.encryption || "").trim().toLowerCase();
  if (!["", "tls", "ssl", "none"].includes(encryption)) {
    throw createServiceError("The configured email encryption mode is invalid.", 503);
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: encryption === "ssl",
    requireTLS: encryption === "tls",
    ...(config.username || config.password
      ? {
          auth: {
            user: config.username,
            pass: config.password,
          },
        }
      : {}),
  });

  try {
    return await transporter.sendMail({
      from: {
        name: config.from_name || config.from_email,
        address: config.from_email,
      },
      to,
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
    });
  } catch (cause) {
    const error = createServiceError(
      "Could not send email through the configured SMTP provider.",
      502
    );
    error.cause = cause;
    throw error;
  }
};
