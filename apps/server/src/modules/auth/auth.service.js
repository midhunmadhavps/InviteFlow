const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (data) => {

  const {
    firstName,
    lastName,
    phone,
    email,
  } = data;

  const existingUser = await User.findOne({
    $or: [
      { phone },
      { email }
    ]
  });

  if (existingUser) {
    if (existingUser.phone === phone) {
      throw new Error("Phone number already registered.");
    }

    if (existingUser.email === email) {
      throw new Error("Email already registered.");
    }
  }

  const user = await User.create({
    firstName,
    lastName,
    phone,
    email,
    status: "Pending",
    isPhoneVerified: false,
  });

  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp = 123456;

  await Otp.findOneAndUpdate(
    { phone },
    {
      phone,
      purpose: "REGISTER",
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
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

exports.verifyOtp = async (data) => {

    const { phone, otp } = data;

    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord) {
        throw new Error("OTP not found.");
    }

    // if (otpRecord.expiresAt < new Date()) {
    //     throw new Error("OTP has expired.");
    // }

    if (otpRecord.otp !== otp) {
        throw new Error("Invalid OTP.");
    }

    const user = await User.findOneAndUpdate(
        { phone },
        {
            isPhoneVerified: true,
            status: "Verified"
        },
        { new: true }
    );

    await Otp.deleteOne({ phone });

    return {
        userId: user._id,
        phone: user.phone,
        status: user.status
    };
};

exports.resendOtp = async (data) => {

    const { phone } = data;

    const user = await User.findOne({ phone });

    if (!user) {
        throw new Error("User not found.");
    }

    const otp = "123456";
// Later:
// const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.findOneAndUpdate(
        { phone },
        {
            phone,
            otp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        },
        {
            upsert: true,
            new: true
        }
    );

    console.log("OTP:", otp);

    return {
      userId: user._id,
      username: user.username
    };
};

exports.setpassword = async (data) => {

  const {
    userId,
    password,
    confirmPassword,
  } = data;

  const existingUser = await User.findOne({ _id: userId });

  if (!existingUser) {
    throw new Error("There is no user Exist.");
  }

  if (existingUser.status === "Pending") {
    throw new Error("User is not verified.");
  }

  if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const updatedUser  = await User.findByIdAndUpdate(
    {  _id: userId  },
    {
      password: hashedPassword,
      status: "Active"
    }
  );

  return {
    userId: existingUser._id
  };
};

exports.login = async (data) => {
  const { username, password } = data;

  const user = await User.findOne({ username });

  if (!user) {
    throw new Error("user not registered.");
  }

  if (!user.isPhoneVerified) {
    throw new Error("Please verify your phone number.");
  }

  if (user.status !== "Active") {
    throw new Error("Account is not active.");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new Error("Invalid password.");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
    },
  };
};

exports.forgotPassword = async (data) => {
  const { phone } = data;

  const user = await User.findOne({
      phone: phone.toLowerCase()
  });

  if (!phone) {
      throw new Error("User not found.");
  }

  const otp = "123456";
  // Later:
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.findOneAndUpdate(
      { phone: user.phone },
      {
          phone: user.phone,
          otp,
          purpose: "FORGOT_PASSWORD",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
      },
      {
          upsert: true,
          new: true
      }
  );

  console.log("Forgot Password OTP:", otp);

  return {
      phone: user.phone
  };
};

exports.resetPassword = async (data) => {
  const {
    userId,
    password,
    confirmPassword,
  } = data;

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new Error("User not found.");
  }

  // Check if forgot-password OTP was verified
  // const otpRecord = await Otp.findOne({
  //   phone: user.phone,
  //   purpose: "FORGOT_PASSWORD",
  //   verified: true,
  // });

  // if (!otpRecord) {
  //   throw new Error("Please verify your OTP first.");
  // }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.status = "Active";

  await user.save();

  // await Otp.deleteOne({
  //   phone,
  //   purpose: "FORGOT_PASSWORD",
  // });

  return {
    // userId: user._id,
    message: "Password reset successfully."
  };
};

exports.logout = async () => {
  return true;
};