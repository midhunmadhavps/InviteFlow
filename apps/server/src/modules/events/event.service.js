const Event = require("../../models/event.model");

createEvent = async (data) => {

    const event = await Event.create(data);

    return event;
};

module.exports = {
  createEvent,
};