const Event = require("../models/event.model");

const generateEventId = async (req, res, next) => {
  try {
    let eventId;
    let exists = true;

    while (exists) {
      const randomNumber = Math.floor(10000 + Math.random() * 90000);
      eventId = `EVENT${randomNumber}`;

      exists = await Event.exists({ eventId });
    }

    req.eventId = eventId;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = generateEventId;