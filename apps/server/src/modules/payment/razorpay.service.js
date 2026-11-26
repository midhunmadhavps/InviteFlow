const crypto = require("crypto");
const mongoose = require("mongoose");
const Event = require("../../models/event.model");
const EventType = require("../../models/eventType.model");
const Payment = require("../../models/payment.model");
const PaymentGatewayConfig = require("../../models/paymentGatewayConfig.model");
const User = require("../../models/user.model");
const { decryptSecret } = require("../../utils/whatsappConfig");

const getRazorpayCredentials = async () => {
  const config = await PaymentGatewayConfig.findById("default").lean();
  const storedSecret = config?.razorpayKeySecret || "";
  const secret = storedSecret.startsWith("enc:v1:")
    ? decryptSecret(storedSecret)
    : storedSecret || process.env.RAZORPAY_KEY_SECRET || "";
  const webhookStoredSecret = config?.razorpayWebhookSecret || "";
  const webhookSecret = webhookStoredSecret.startsWith("enc:v1:")
    ? decryptSecret(webhookStoredSecret)
    : webhookStoredSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const keyId = config?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || "";

  if (!keyId || !secret) {
    const error = new Error("Razorpay API credentials are not configured.");
    error.statusCode = 503;
    throw error;
  }
  return { config, keyId, secret, webhookSecret };
};

const requestRazorpay = async (path, credentials, method = "GET", body) => {
  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${credentials.keyId}:${credentials.secret}`
        ).toString("base64")}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    const error = new Error("Could not connect to Razorpay. Please try again.");
    error.statusCode = 502;
    throw error;
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      result.error?.description || "Razorpay could not process the payment request."
    );
    error.statusCode = 502;
    throw error;
  }
  return result;
};

const getOwnedEvent = async (eventId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    const error = new Error("Provide a valid event to pay for.");
    error.statusCode = 400;
    throw error;
  }
  const event = await Event.findOne({ _id: eventId, userId }).select(
    "_id title eventTypeId"
  );
  if (!event) {
    const error = new Error("Event not found.");
    error.statusCode = 404;
    throw error;
  }
  const eventType = await EventType.findById(event.eventTypeId).select(
    "name price isActive"
  );
  if (!eventType || eventType.isActive === false) {
    const error = new Error("This event type is not available for payment.");
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isFinite(eventType.price) || eventType.price <= 0) {
    const error = new Error(
      "A valid price has not been configured for this event type."
    );
    error.statusCode = 400;
    throw error;
  }
  return { event, eventType };
};

const assertRazorpayIsPrimary = (config) => {
  if (
    config?.enabled !== true ||
    config?.providerEnabled?.razorpay !== true ||
    config?.primaryProvider !== "razorpay"
  ) {
    const error = new Error("Razorpay is not the active primary payment provider.");
    error.statusCode = 403;
    throw error;
  }
};

const verifyPaidLink = async (payment, link) => {
  if (link.id !== payment.razorpayPaymentLinkId) {
    const error = new Error("Razorpay payment link does not match this payment.");
    error.statusCode = 400;
    throw error;
  }
  if (link.status !== "paid") return payment;

  const expectedAmount = Math.round(payment.amount * 100);
  const amountPaid = Number(link.amount_paid);
  if (
    link.currency !== payment.currency ||
    !Number.isFinite(amountPaid) ||
    amountPaid !== expectedAmount
  ) {
    const error = new Error("Razorpay payment details do not match this payment.");
    error.statusCode = 400;
    throw error;
  }
  const updatedPayment = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: "Approved" } },
    {
      $set: {
        status: "Approved",
        razorpayPaymentId: link.payment_id || payment.razorpayPaymentId,
      },
    },
    { new: true }
  );
  return updatedPayment || Payment.findById(payment._id);
};

const createPaymentLink = async ({ eventId, userId }) => {
  const { config, keyId, secret } = await getRazorpayCredentials();
  assertRazorpayIsPrimary(config);
  const { event, eventType } = await getOwnedEvent(eventId, userId);

  const approvedPayment = await Payment.findOne({
    eventId: event._id,
    userId,
    status: "Approved",
  }).select("_id");
  if (approvedPayment) {
    return { alreadyPaid: true, paymentId: approvedPayment._id };
  }

  const pendingPayment = await Payment.findOne({
    eventId: event._id,
    userId,
    provider: "razorpay",
    status: "Pending",
    razorpayPaymentLinkId: { $ne: "" },
  }).sort({ createdAt: -1 });
  if (pendingPayment?.razorpayPaymentLinkId) {
    const existingLink = await requestRazorpay(
      `/payment_links/${encodeURIComponent(
        pendingPayment.razorpayPaymentLinkId
      )}`,
      { keyId, secret }
    );
    if (existingLink.status === "paid") {
      await verifyPaidLink(pendingPayment, existingLink);
      return { alreadyPaid: true, paymentId: pendingPayment._id };
    }
    if (
      ["created", "issued", "partially_paid"].includes(existingLink.status) &&
      pendingPayment.razorpayPaymentUrl
    ) {
      return {
        paymentId: pendingPayment._id,
        paymentUrl: pendingPayment.razorpayPaymentUrl,
        amount: pendingPayment.amount,
        currency: pendingPayment.currency,
      };
    }
    await Payment.findByIdAndUpdate(pendingPayment._id, {
      $set: { status: "Rejected" },
    });
  }

  const amount = Math.round(eventType.price * 100) / 100;
  const payment = await Payment.create({
    eventId: event._id,
    userId,
    amount,
    currency: "INR",
    provider: "razorpay",
    status: "Pending",
  });

  try {
    const customer = await User.findById(userId).select(
      "firstName lastName email phone"
    );
    const customerName = [customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(" ");
    const customerDetails = {
      ...(customerName ? { name: customerName } : {}),
      ...(customer?.email ? { email: customer.email } : {}),
      ...(customer?.phone ? { contact: customer.phone } : {}),
    };
    const link = await requestRazorpay(
      "/payment_links",
      { keyId, secret },
      "POST",
      {
        amount: Math.round(amount * 100),
        currency: "INR",
        accept_partial: false,
        description: `${eventType.name} event payment: ${event.title}`,
        ...(Object.keys(customerDetails).length
          ? { customer: customerDetails }
          : {}),
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes: {
          paymentId: payment._id.toString(),
          eventId: event._id.toString(),
          userId: userId.toString(),
        },
      }
    );

    if (!link.id || !link.short_url) {
      throw new Error("Razorpay did not return a payment link.");
    }

    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        razorpayPaymentLinkId: link.id,
        razorpayPaymentUrl: link.short_url,
      },
    });
    return {
      paymentId: payment._id,
      paymentUrl: link.short_url,
      amount,
      currency: "INR",
    };
  } catch (error) {
    await Payment.findByIdAndUpdate(payment._id, {
      $set: { status: "Rejected" },
    });
    throw error;
  }
};

const getPaymentStatus = async ({ eventId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    const error = new Error("Provide a valid event to check payment status.");
    error.statusCode = 400;
    throw error;
  }
  const payment = await Payment.findOne({
    eventId,
    userId,
    provider: "razorpay",
  }).sort({ createdAt: -1 });
  if (!payment) return { status: "NotStarted", approved: false };
  if (payment.status === "Approved") {
    return { status: payment.status, approved: true };
  }
  if (!payment.razorpayPaymentLinkId) {
    return { status: payment.status, approved: false };
  }

  const { keyId, secret } = await getRazorpayCredentials();
  const link = await requestRazorpay(
    `/payment_links/${encodeURIComponent(payment.razorpayPaymentLinkId)}`,
    { keyId, secret }
  );
  const updatedPayment = await verifyPaidLink(payment, link);
  return {
    status: updatedPayment?.status || payment.status,
    approved: updatedPayment?.status === "Approved",
  };
};

const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!Buffer.isBuffer(rawBody) || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest();
  let received;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
};

const handleWebhook = async ({ rawBody, signature, event }) => {
  const { webhookSecret } = await getRazorpayCredentials();
  if (!webhookSecret) {
    const error = new Error("Razorpay webhook secret is not configured.");
    error.statusCode = 503;
    throw error;
  }
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    const error = new Error("Invalid Razorpay webhook signature.");
    error.statusCode = 400;
    throw error;
  }
  if (event?.event !== "payment_link.paid") return { received: true };

  const link = event.payload?.payment_link?.entity;
  if (!link?.id) {
    const error = new Error("Razorpay webhook is missing the payment link.");
    error.statusCode = 400;
    throw error;
  }
  const payment = await Payment.findOne({
    razorpayPaymentLinkId: link.id,
    provider: "razorpay",
  });
  if (!payment) return { received: true };

  await verifyPaidLink(payment, {
    ...link,
    payment_id: event.payload?.payment?.entity?.id || link.payment_id,
  });
  return { received: true };
};

module.exports = {
  createPaymentLink,
  getPaymentStatus,
  handleWebhook,
};
