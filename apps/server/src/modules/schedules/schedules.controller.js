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
        ...(error.duplicateContacts
          ? { duplicateContacts: error.duplicateContacts }
          : {}),
      });
    }

    console.error("Schedule invites error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to schedule invites.",
    });
  }
};

const getScheduleInvites = async (req, res) => {
  const { eventId } = req.query;
  if (eventId && !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({
      success: false,
      message: "A valid event ID is required.",
    });
  }

  try {
    const result = await schedulesService.getScheduleInvites({
      eventId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Scheduled invites loaded successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Load scheduled invites error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load scheduled invites.",
    });
  }
};

const updateScheduleInviteStatus = async (req, res) => {
  const { id } = req.params;
  const { is_complete: isComplete } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || typeof isComplete !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "A valid schedule invite ID and is_complete boolean are required.",
    });
  }

  try {
    const result = await schedulesService.updateScheduleInviteStatus({
      scheduleInviteId: id,
      isComplete,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Scheduled invite not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invite status updated successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Update scheduled invite status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invite status.",
    });
  }
};

const deletePendingScheduleInvite = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "A valid scheduled invite ID is required.",
    });
  }

  try {
    const result = await schedulesService.deletePendingScheduleInvite({
      scheduleInviteId: id,
      userId: req.user._id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Pending scheduled invite not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scheduled invite deleted successfully.",
    });
  } catch (error) {
    console.error("Delete scheduled invite error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete scheduled invite.",
    });
  }
};

module.exports = {
  createScheduleInvites,
  getScheduleInvites,
  updateScheduleInviteStatus,
  deletePendingScheduleInvite,
};