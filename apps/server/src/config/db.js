const mongoose = require("mongoose");

async function connectDB() {
    try {
        const mongoUri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

        await mongoose.connect(mongoUri);

        console.log("✅ MongoDB Connected");

    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
        process.exit(1);
    }
}

module.exports = connectDB;