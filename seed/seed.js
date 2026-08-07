const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const EventType = require("../apps/server/src/models/eventType.model");

const eventTypes = [
  {
    name: "Wedding",
    icon: "💍",
    description: "Wedding Ceremony",
  },
  {
    name: "Engagement",
    icon: "💖",
    description: "Engagement Ceremony",
  },
  {
    name: "Birthday",
    icon: "🎂",
    description: "Birthday Celebration",
  },
  {
    name: "Housewarming",
    icon: "🏠",
    description: "Housewarming Ceremony",
  },
  {
    name: "Baby Shower",
    icon: "👶",
    description: "Baby Shower Event",
  },
  {
    name: "Anniversary",
    icon: "💐",
    description: "Wedding Anniversary",
  },
  {
    name: "Corporate Event",
    icon: "🏢",
    description: "Corporate Meeting or Event",
  },
  {
    name: "Conference",
    icon: "🎤",
    description: "Conference & Seminar",
  },
  {
    name: "Graduation",
    icon: "🎓",
    description: "Graduation Ceremony",
  },
  {
    name: "Festival",
    icon: "🎉",
    description: "Festival Celebration",
  },
  {
    name: "Religious Event",
    icon: "🕌",
    description: "Religious Gathering",
  },
  {
    name: "Other",
    icon: "✨",
    description: "Custom Event",
  },
];

async function seedEventTypes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await EventType.deleteMany();

    await EventType.insertMany(eventTypes);

    console.log("Event Types Seeded Successfully");

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
}

seedEventTypes();