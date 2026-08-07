const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");

exports.register = async (data) => {

  const {
    firstName,
    middleName,
    lastName,
    phone,
    email,
  } = data;

  const existingUser = await User.findOne({ phone });

  if (existingUser) {
    throw new Error("Phone number already registered.");
  }

  const user = await User.create({
    firstName,
    middleName,
    lastName,
    phone,
    email,
    status: "Pending",
    isPhoneVerified: false,
  });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
    { phone },
    {
      phone,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    },
    {
      upsert: true,
      new: true
    }
  );

  console.log("OTP:", otp);

  // TODO:
  // Send OTP via SMS provider

  return {
    userId: user._id,
    phone: user.phone
  };
};