const Event = require("../../models/event.model");
const EventTypes = require("../../models/eventType.model");

createEvent = async (data) => {
    const event = await Event.create(data);
    return event;
};

eventTypes = async () => {
    const eventTypes = await EventTypes.find().sort({ name: 1 });
    return eventTypes;
};

module.exports = {
  createEvent,eventTypes
};