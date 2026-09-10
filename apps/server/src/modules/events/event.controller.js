const eventService = require("./event.service");

const createEvent = async (req, res) => {
  try {
    console.log("=================================");
    console.log("CREATE EVENT");
    console.log("=================================");

    console.log("REQ BODY:", req.body);
    console.log("REQ FILES:", req.files);

    // Check exactly what Multer returned
    console.log(
      "HOST ONE FILENAME:",
      req.files?.hostOneImage?.[0]?.filename
    );

    console.log(
      "HOST TWO FILENAME:",
      req.files?.hostTwoImage?.[0]?.filename
    );

    console.log(
      "INVITATION FILENAME:",
      req.files?.invitation?.[0]?.filename
    );

    console.log("EVENT ID FROM MIDDLEWARE:", req.eventId);

    const location = req.body.location
      ? JSON.parse(req.body.location)
      : {};

    const data = {
      eventId: req.eventId,

      userId: req.body.userId,
      eventTypeId: req.body.eventTypeId,

      title: req.body.title,

      hostOne: req.body.hostOne,
      hostTwo: req.body.hostTwo,

      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,

      address: req.body.address,
      location,

      message: req.body.message,

      // IMPORTANT:
      // Store only the filename in MongoDB
      hostOneImage:
        req.files?.hostOneImage?.[0]?.filename || null,

      hostTwoImage:
        req.files?.hostTwoImage?.[0]?.filename || null,

      invitation:
        req.files?.invitation?.[0]?.filename || null,

      reminderDaysBefore:
        req.body.reminderDaysBefore || 1,

      isPublished:
        req.body.isPublished === "true",

      status:
        req.body.status || "Draft",
    };

    console.log("=================================");
    console.log("EVENT DATA TO SAVE:");
    console.log(data);
    console.log("=================================");

    const result = await eventService.createEvent(data);

    return res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Create event error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const eventTypes = async (req, res) => {
  try {
    const result = await eventService.eventTypes();

    return res.status(200).json({
      success: true,
      message: "Event Type listed successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Event types error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const eventLists = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await eventService.eventLists(userId);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const events = result.map((event) => {
      const eventData = event.toObject();

      return {
        ...eventData,

        // Convert filename into public URL
        hostOneImage: eventData.hostOneImage
          ? `${baseUrl}/uploads/${eventData.hostOneImage}`
          : null,

        hostTwoImage: eventData.hostTwoImage
          ? `${baseUrl}/uploads/${eventData.hostTwoImage}`
          : null,

        invitation: eventData.invitation
          ? `${baseUrl}/uploads/${eventData.invitation}`
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Events loaded successfully.",
      data: events,
    });
  } catch (error) {
    console.log("Load events error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createEvent,
  eventTypes,
  eventLists,
};
