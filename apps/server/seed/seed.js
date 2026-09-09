const path = require("path");
const envPath = path.join(__dirname, "../../../.env");
require("dotenv").config({
  path: envPath,
});

const mongoose = require("mongoose");

const EventType = require("../src/models/eventType.model");

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

    const mongoUri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    await mongoose.connect(mongoUri);

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