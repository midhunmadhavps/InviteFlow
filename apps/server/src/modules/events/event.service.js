const Event = require("../../models/event.model");
const EventTypes = require("../../models/eventType.model");

const createEvent = async (data) => {
  const event = await Event.create(data);

  return event;
};

const eventTypes = async () => {
  const eventTypes = await EventTypes.find().sort({ name: 1 });

  return eventTypes;
};

const eventLists = async (userId) => {
  const eventLists = await Event.find({ userId })
    .sort({ createdAt: -1 })
    .populate("eventTypeId", "name");

  return eventLists;
};

module.exports = {
  createEvent,
  eventTypes,
  eventLists,
};