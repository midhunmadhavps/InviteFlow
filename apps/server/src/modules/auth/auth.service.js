const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");
const SystemConfig = require("../../models/systemConfig.model");

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUsername } = require("../users/user.utils");

exports.register = async (data) => {
  if (!(await exports.isRegistrationEnabled())) {
    const error = new Error("Customer registration is currently disabled.");
    error.statusCode = 403;
    throw error;
  }

  const {
    firstName,
    lastName,
    phone,
    email,
  } = data;

  const normalizedFirstName = typeof firstName === "string" ? firstName.trim() : "";
  const normalizedLastName = typeof lastName === "string" ? lastName.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

  const existingUser = await User.findOne({
    $or: [
      { phone: normalizedPhone },
      { email: normalizedEmail }
    ]
  });

  if (existingUser) {
    if (existingUser.phone === normalizedPhone) {
      throw new Error("Phone number already registered.");
    }

    if (existingUser.email === normalizedEmail) {
      throw new Error("Email already registered.");
    }
  }

  const username = await createUsername(normalizedFirstName, normalizedLastName);

  const user = await User.create({
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    phone: normalizedPhone,
    email: normalizedEmail,
    username,
    status: "Pending",
    isPhoneVerified: false,
  });

  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp = 123456;

  await Otp.findOneAndUpdate(
    { phone: normalizedPhone },
    {
      phone: normalizedPhone,
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
    phone: user.phone,
    username: user.username,
  };
};

exports.isRegistrationEnabled = async () => {
  const config = await SystemConfig.findById("default").lean();
  return config?.allowRegistration ?? true;
};

exports.verifyOtp = async (data) => {

    const { phone, otp } = data;

    const otpRecord = await Otp.findOne({
      phone,
      purpose: { $ne: "USER_LOGIN" },
    });

    if (!otpRecord) {
        throw new Error("OTP not found.");
    }

    if (otpRecord.expiresAt < new Date()) {
        throw new Error("OTP has expired.");
    }

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

    await Otp.deleteOne({ _id: otpRecord._id });

    return {
        userId: user._id,
        phone: user.phone,
        status: user.status,
        purpose: user.purpose,
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
  const updatedUser = await User.findByIdAndUpdate( userId, { password: hashedPassword, status: "Active", }, { new: true } ); 
  return { userId: updatedUser._id, };

};

exports.login = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("user not registered.");
  }

  if (!user.isPhoneVerified) {
    throw new Error("Please verify your phone number.");
  }

  if (user.status !== "Active") {
    throw new Error("Account is not active.");
  }

  if (user.isEnabled === false) {
    throw new Error("Account access has been disabled.");
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

const findLoginUser = async (email, phone) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
  if (!normalizedEmail || !normalizedPhone) {
    const error = new Error("Email and mobile number are required.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    email: normalizedEmail,
    phone: normalizedPhone,
    role: "customer",
  });
  if (!user) {
    const error = new Error("Email and mobile number do not match an account.");
    error.statusCode = 404;
    throw error;
  }
  if (!user.isEnabled) {
    const error = new Error("Account access has been disabled.");
    error.statusCode = 403;
    throw error;
  }
  if (user.status !== "Active" || !user.isPhoneVerified) {
    const error = new Error("Account is not active.");
    error.statusCode = 403;
    throw error;
  }
  if (!user.password) {
    const error = new Error("A password has not been set for this account.");
    error.statusCode = 403;
    throw error;
  }

  return user;
};

const createLoginOtp = async (user) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  await Otp.findOneAndUpdate(
    { phone: user.phone, purpose: "USER_LOGIN" },
    {
      phone: user.phone,
      purpose: "USER_LOGIN",
      otp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
    { upsert: true, new: true }
  );

  console.log("Login OTP:", otp);
  return { phone: user.phone };
};

const createLoginSession = async (user) => {
  user.lastLogin = new Date();
  await user.save();

  const token = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
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

exports.requestLoginOtp = async ({ email, phone }) => {
  const user = await findLoginUser(email, phone);
  return createLoginOtp(user);
};

exports.resendLoginOtp = async ({ email, phone }) => {
  const user = await findLoginUser(email, phone);
  return createLoginOtp(user);
};

exports.verifyLoginOtp = async ({ email, phone, otp }) => {
  const user = await findLoginUser(email, phone);
  const otpRecord = await Otp.findOne({ phone: user.phone, purpose: "USER_LOGIN" });

  if (!otpRecord) {
    throw new Error("Login OTP not found. Request a new OTP.");
  }
  if (otpRecord.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new Error("Login OTP has expired. Request a new OTP.");
  }
  if (otpRecord.otp !== String(otp || "")) {
    throw new Error("Invalid login OTP.");
  }

  await Otp.deleteOne({ _id: otpRecord._id });
  return createLoginSession(user);
};

exports.forgotPassword = async (data) => {
  const { phone } = data;

  if (!phone) {
    throw new Error("Phone number is required.");
  }

  const user = await User.findOne({
    phone: phone.trim()
  });

  if (!user) {
    throw new Error("Phone number is not registered.");
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