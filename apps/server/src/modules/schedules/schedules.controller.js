const mongoose = require("mongoose");
const schedulesService = require("./schedules.service");

const createScheduleInvites = async (req, res) => {
  const { eventId, contactIds, scheduledAt } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(eventId) ||
    !Array.isArray(contactIds) ||
    contactIds.length === 0 ||
    contactIds.some((id) => !mongoose.Types.ObjectId.isValid(id)) ||
    !scheduledAt ||
    Number.isNaN(new Date(scheduledAt).getTime())
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid event, at least one contact, and a scheduled date and time are required.",
    });
  }

  const uniqueContactIds = [...new Set(contactIds.map(String))];

  try {
    const result = await schedulesService.createScheduleInvites({
      eventId,
      contactIds: uniqueContactIds,
      scheduledAt: new Date(scheduledAt),
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Invites scheduled successfully.",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Schedule invites error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to schedule invites.",
    });
  }
};

module.exports = { createScheduleInvites };