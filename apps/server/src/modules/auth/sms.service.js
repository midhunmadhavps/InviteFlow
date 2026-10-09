const SmsConfig = require("../../models/smsConfig.model");

exports.sendSms = async ({ to, message }) => {
  const config = await SmsConfig.findById("default").lean();
  if (!config?.is_active || !config.api_url) {
    const error = new Error("SMS delivery is not configured or enabled.");
    error.statusCode = 503;
    throw error;
  }

  let endpoint;
  try {
    endpoint = new URL(config.api_url);
  } catch {
    const error = new Error("The configured SMS API URL is invalid.");
    error.statusCode = 503;
    throw error;
  }
  if (!["http:", "https:"].includes(endpoint.protocol)) {
    const error = new Error("The configured SMS API URL must use HTTP or HTTPS.");
    error.statusCode = 503;
    throw error;
  }

  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (config.api_key) headers.Authorization = `Bearer ${config.api_key}`;
  if (config.api_secret) headers["X-API-Secret"] = config.api_secret;
  if (config.username || config.password) {
    headers.Authorization = `Basic ${Buffer.from(
      `${config.username || ""}:${config.password || ""}`
    ).toString("base64")}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to,
        message,
        sender_id: config.sender_id || undefined,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    const error = new Error("Could not connect to the configured SMS provider.");
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const error = new Error("The SMS provider rejected the OTP message.");
    error.statusCode = 502;
    throw error;
  }
};
