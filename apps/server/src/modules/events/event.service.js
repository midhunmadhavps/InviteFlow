const Event = require("../../models/event.model");
const EventTypes = require("../../models/eventType.model");

const generateEventId = () => {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `EVENT${randomNumber}`;
};

const createEvent = async (data) => {
  let eventId;
  let exists = true;

  while (exists) {
    eventId = generateEventId();
    exists = await Event.exists({ eventId });
  }

  const event = await Event.create({
    ...data,
    eventId,
  });

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