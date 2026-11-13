const path = require("path");
const Contact = require("../../models/contact.model");
const Event = require("../../models/event.model");
const ScheduleInvite = require("../../models/scheduleInvite.model");

const createServiceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildPublicFileUrl = (file) => {
  if (/^https?:\/\//i.test(file)) {
    return file;
  }

  const publicUrl = process.env.API_PUBLIC_URL?.replace(/\/+$/, "");
  if (!publicUrl) {
    throw createServiceError(
      "Set API_PUBLIC_URL to a publicly reachable server URL to send event images and invitations.",
      503
    );
  }

  return `${publicUrl}/uploads/${encodeURIComponent(path.basename(file))}`;
};

const sendWhatsAppMessage = async (phoneNumberId, accessToken, to, message) => {
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v22.0";
  if (!/^v\d+\.\d+$/.test(apiVersion)) {
    throw createServiceError("The WhatsApp API version is invalid.", 503);
  }

  let response;
  try {
    response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          ...message,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch {
    throw createServiceError("Could not connect to the WhatsApp service.", 502);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const error = createServiceError(
      result?.error?.message || "WhatsApp could not deliver the invitation.",
      502
    );
    throw error;
  }
};

const getEventAssets = (event) => {
  const assets = [];
  for (const [label, file] of [
    ["Host photo", event.hostOneImage],
    ["Host photo", event.hostTwoImage],
    ["Event invitation", event.invitation],
  ]) {
    if (!file) {
      continue;
    }

    const fileName = path.basename(file.split("?")[0]);
    const extension = path.extname(fileName).toLowerCase();
    const url = buildPublicFileUrl(file);
    if (label === "Event invitation" && extension === ".pdf") {
      assets.push({
        type: "document",
        document: { link: url, filename: fileName },
      });
    } else if (/\.(jpe?g|png|webp)$/i.test(extension)) {
      assets.push({
        type: "image",
        image: { link: url },
      });
    } else if (label === "Event invitation") {
      assets.push({
        type: "document",
        document: { link: url, filename: fileName },
      });
    }
  }
  return assets;
};

const buildEventMessage = (event) => {
  const location = event.location?.address || event.address;
  const lines = [
    `You're invited to ${event.title}!`,
    event.hostOne || event.hostTwo
      ? `Hosted by ${[event.hostOne, event.hostTwo].filter(Boolean).join(" and ")}`
      : null,
    event.eventDate
      ? `Date: ${new Date(event.eventDate).toLocaleDateString()}`
      : null,
    event.eventTime ? `Time: ${event.eventTime}` : null,
    location ? `Location: ${location}` : null,
    event.location?.googleMapsUrl || null,
    event.message || null,
  ];

  return lines.filter(Boolean).join("\n");
};

const sendEventInvitations = async ({ eventId, contactIds, userId }) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw createServiceError(
      "WhatsApp delivery is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      503
    );
  }

  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) {
    throw createServiceError("Event not found.", 404);
  }

  const contacts = await Contact.find({
    _id: { $in: contactIds },
    userId,
  }).select("_id name phoneNumber");
  if (contacts.length !== contactIds.length) {
    throw createServiceError(
      "One or more selected contacts are unavailable.",
      400
    );
  }

  const messageText = buildEventMessage(event);
  const assets = getEventAssets(event);
  const results = [];

  for (const contact of contacts) {
    const to = contact.phoneNumber.replace(/\D/g, "");
    if (to.length < 8 || to.length > 15) {
      results.push({
        contactId: contact._id.toString(),
        name: contact.name,
        sent: false,
        error: "Contact phone number must include its country code.",
      });
      continue;
    }

    try {
      await sendWhatsAppMessage(phoneNumberId, accessToken, to, {
        type: "text",
        text: { preview_url: true, body: messageText },
      });

      for (const asset of assets) {
        await sendWhatsAppMessage(phoneNumberId, accessToken, to, asset);
      }

      await ScheduleInvite.updateMany(
        { eventId: event._id, contactId: contact._id },
        { $set: { is_complete: true } }
      );
      results.push({
        contactId: contact._id.toString(),
        name: contact.name,
        sent: true,
      });
    } catch (error) {
      results.push({
        contactId: contact._id.toString(),
        name: contact.name,
        sent: false,
        error: error.message,
      });
    }
  }

  const sentCount = results.filter((result) => result.sent).length;
  return {
    sentCount,
    failedCount: results.length - sentCount,
    results,
    message: `Invitation sent to ${sentCount} of ${results.length} selected contacts.`,
  };
};

module.exports = { sendEventInvitations };
