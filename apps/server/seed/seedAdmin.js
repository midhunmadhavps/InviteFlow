const path = require("path");
const envPath = path.resolve(__dirname, "../../../.env");
require("dotenv").config({ path: envPath });

const mongoose = require("mongoose");
const User = require("../src/models/user.model");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "midhun.s@zerone-consulting.com").trim().toLowerCase();
const ADMIN_PHONE = (process.env.ADMIN_PHONE || "9876543210").trim();

async function seedAdmin() {
  try {
    const mongoUri = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for admin seeding...");

    // 1. Seed or Update Admin User
    let adminUser = await User.findOne({ email: ADMIN_EMAIL });

    if (adminUser) {
      adminUser.role = "admin";
      adminUser.status = "Active";
      adminUser.isEmailVerified = true;
      adminUser.isPhoneVerified = true;
      await adminUser.save();
      console.log(`✅ Existing user updated to ADMIN: ${ADMIN_EMAIL} (${adminUser._id})`);
    } else {
      const existingPhoneUser = await User.findOne({ phone: ADMIN_PHONE });
      const phoneToUse = existingPhoneUser ? `98765${Math.floor(10000 + Math.random() * 90000)}` : ADMIN_PHONE;

      adminUser = await User.create({
        username: "midhunadmin",
        firstName: "Midhun",
        lastName: "Admin",
        email: ADMIN_EMAIL,
        phone: phoneToUse,
        role: "admin",
        status: "Active",
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log(`✅ New ADMIN user created: ${ADMIN_EMAIL} (${adminUser._id})`);
    }

    // 2. Ensure existing customer users retain role = "customer"
    await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: "customer" } }
    );
    console.log("✅ Verified all other users default to role = 'customer'");

    console.log("\n🎉 Admin seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin seeding error:", error);
    process.exit(1);
  }
}

seedAdmin();
