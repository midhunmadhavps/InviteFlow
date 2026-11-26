const PaymentGatewayConfig = require("../../models/paymentGatewayConfig.model");
const { encryptSecret } = require("../../utils/whatsappConfig");

const providerNames = ["razorpay", "phonepe", "paypal"];

const paymentFields = {
  razorpayKeyId: {
    env: "RAZORPAY_KEY_ID",
  },
  razorpayKeySecret: {
    env: "RAZORPAY_KEY_SECRET",
    secret: true,
  },
  razorpayWebhookSecret: {
    env: "RAZORPAY_WEBHOOK_SECRET",
    secret: true,
  },
  phonepeClientId: {
    env: "PHONEPE_CLIENT_ID",
  },
  phonepeClientSecret: {
    env: "PHONEPE_CLIENT_SECRET",
    secret: true,
  },
  phonepeClientVersion: {
    env: "PHONEPE_CLIENT_VERSION",
    defaultValue: "1",
  },
  phonepeWebhookUsername: {
    env: "PHONEPE_WEBHOOK_USERNAME",
    secret: true,
  },
  phonepeWebhookPassword: {
    env: "PHONEPE_WEBHOOK_PASSWORD",
    secret: true,
  },
  paypalClientId: {
    env: "PAYPAL_CLIENT_ID",
  },
  paypalClientSecret: {
    env: "PAYPAL_CLIENT_SECRET",
    secret: true,
  },
  paypalWebhookId: {
    env: "PAYPAL_WEBHOOK_ID",
  },
};

const getPaymentGatewayConfig = async () => {
  const config = await PaymentGatewayConfig.findById("default").lean();
  const credentials = Object.fromEntries(
    Object.entries(paymentFields).map(([field, options]) => [
      field,
      Boolean(config?.[field] || process.env[options.env]),
    ])
  );
  const phonepeClientVersion =
    config?.phonepeClientVersion ||
    process.env.PHONEPE_CLIENT_VERSION ||
    "1";
  const paypalEnvironment =
    config?.paypalEnvironment ||
    process.env.PAYPAL_ENVIRONMENT ||
    "sandbox";

  return {
    enabled: config?.enabled === true,
    credentials,
    phonepeClientVersion,
    paypalEnvironment,
    providerEnabled: Object.fromEntries(
      providerNames.map((provider) => [
        provider,
        config?.providerEnabled?.[provider] === true,
      ])
    ),
    primaryProvider: config?.primaryProvider || null,
  };
};

const savePaymentGatewayConfig = async (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const error = new Error("Provide valid payment gateway settings.");
    error.statusCode = 400;
    throw error;
  }

  const update = {};
  if (Object.prototype.hasOwnProperty.call(input, "enabled")) {
    if (typeof input.enabled !== "boolean") {
      const error = new Error("enabled must be true or false.");
      error.statusCode = 400;
      throw error;
    }
    update.enabled = input.enabled;
  }

  Object.entries(paymentFields).forEach(([field, options]) => {
    if (!Object.prototype.hasOwnProperty.call(input, field)) return;
    if (typeof input[field] !== "string") {
      const error = new Error(`${field} must be a string.`);
      error.statusCode = 400;
      throw error;
    }

    const value = input[field].trim();
    if (value) {
      update[field] = options.secret ? encryptSecret(value) : value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(input, "paypalEnvironment")) {
    if (!["sandbox", "live"].includes(input.paypalEnvironment)) {
      const error = new Error(
        "paypalEnvironment must be either sandbox or live."
      );
      error.statusCode = 400;
      throw error;
    }
    update.paypalEnvironment = input.paypalEnvironment;
  }

  const updatesProviderEnablement = Object.prototype.hasOwnProperty.call(
    input,
    "providerEnabled"
  );
  const updatesPrimaryProvider = Object.prototype.hasOwnProperty.call(
    input,
    "primaryProvider"
  );
  if (updatesProviderEnablement || updatesPrimaryProvider) {
    const config = await PaymentGatewayConfig.findById("default").lean();
    const currentProviderEnabled = Object.fromEntries(
      providerNames.map((provider) => [
        provider,
        config?.providerEnabled?.[provider] === true,
      ])
    );
    let providerEnabled = currentProviderEnabled;

    if (updatesProviderEnablement) {
      const requestedProviders = input.providerEnabled;
      if (
        !requestedProviders ||
        typeof requestedProviders !== "object" ||
        Array.isArray(requestedProviders) ||
        providerNames.some(
          (provider) => typeof requestedProviders[provider] !== "boolean"
        ) ||
        Object.keys(requestedProviders).some(
          (provider) => !providerNames.includes(provider)
        )
      ) {
        const error = new Error(
          "providerEnabled must contain boolean values for Razorpay, PhonePe, and PayPal."
        );
        error.statusCode = 400;
        throw error;
      }
      providerEnabled = requestedProviders;
    }

    let primaryProvider = updatesPrimaryProvider
      ? input.primaryProvider
      : config?.primaryProvider || null;
    if (
      primaryProvider !== null &&
      !providerNames.includes(primaryProvider)
    ) {
      const error = new Error(
        "primaryProvider must be Razorpay, PhonePe, PayPal, or null."
      );
      error.statusCode = 400;
      throw error;
    }

    const enabledProviders = providerNames.filter(
      (provider) => providerEnabled[provider]
    );
    if (primaryProvider && !providerEnabled[primaryProvider]) {
      if (updatesPrimaryProvider) {
        const error = new Error("The primary payment provider must be enabled.");
        error.statusCode = 400;
        throw error;
      }
      primaryProvider = enabledProviders[0] || null;
    } else if (!primaryProvider && enabledProviders.length) {
      if (updatesPrimaryProvider) {
        const error = new Error(
          "Choose an enabled primary payment provider before saving."
        );
        error.statusCode = 400;
        throw error;
      }
      primaryProvider = enabledProviders[0];
    }

    update.providerEnabled = providerEnabled;
    update.primaryProvider = primaryProvider;
  }

  if (!Object.keys(update).length) {
    const error = new Error("Provide at least one payment gateway setting to save.");
    error.statusCode = 400;
    throw error;
  }

  await PaymentGatewayConfig.findByIdAndUpdate(
    "default",
    { $set: update },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return getPaymentGatewayConfig();
};

module.exports = {
  getPaymentGatewayConfig,
  savePaymentGatewayConfig,
};
