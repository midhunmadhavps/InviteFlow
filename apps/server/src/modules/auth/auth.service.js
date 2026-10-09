const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");
const SystemConfig = require("../../models/systemConfig.model");
const smsService = require("./services/sms.service");

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
    const purpose = data.purpose || "REGISTER";
    if (!["REGISTER", "FORGOT_PASSWORD"].includes(purpose)) {
      throw new Error("Invalid OTP purpose.");
    }

    const otpRecord = await Otp.findOne({
      phone,
      purpose,
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
    const purpose = data.purpose || "REGISTER";
    if (!["REGISTER", "FORGOT_PASSWORD"].includes(purpose)) {
      throw new Error("Invalid OTP purpose.");
    }

    const user = await User.findOne({ phone });

    if (!user) {
        throw new Error("User not found.");
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    await Otp.findOneAndUpdate(
        { phone, purpose },
        {
            phone,
            purpose,
            otp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        },
        {
            upsert: true,
            new: true
        }
    );

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
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const { password } = data;

  const user = await User.findOne({ email, role: "customer" });

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  if (user.isEnabled === false) {
    const error = new Error("Account access has been disabled.");
    error.statusCode = 403;
    throw error;
  }
  if (!user.isPhoneVerified || user.status !== "Active") {
    const error = new Error("Account is not active or verified.");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordCorrect = typeof password === "string" && user.password
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!isPasswordCorrect) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
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

const findLoginUser = async (email) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) {
    const error = new Error("Email is required.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    email: normalizedEmail,
    role: "customer",
  });
  if (!user || !user.isEnabled || user.status !== "Active" || !user.isPhoneVerified) {
    const error = new Error("If an active account matches that email, a login code will be sent.");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const loginOtpHash = (userId, otp) => crypto
  .createHmac("sha256", process.env.JWT_SECRET)
  .update(`${userId}:${otp}`)
  .digest("hex");

const createLoginOtp = async (user) => {
  const priorOtp = await Otp.findOne({
    userId: user._id,
    phone: user.phone,
    purpose: "LOGIN",
  });
  const resendCooldownMs = 60 * 1000;
  if (priorOtp?.sentAt && Date.now() - priorOtp.sentAt.getTime() < resendCooldownMs) {
    const error = new Error("Please wait before requesting another login code.");
    error.statusCode = 429;
    throw error;
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const now = new Date();
  const otpRecord = priorOtp || new Otp({ phone: user.phone, purpose: "LOGIN" });
  otpRecord.userId = user._id;
  otpRecord.otp = loginOtpHash(user._id, otp);
  otpRecord.expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  otpRecord.sentAt = now;
  otpRecord.attempts = 0;
  otpRecord.usedAt = null;
  await otpRecord.save();

  try {
    await smsService.sendSms({
      to: user.phone,
      message: `Your InviteFlow login code is ${otp}. It expires in 10 minutes.`,
    });
  } catch (error) {
    otpRecord.usedAt = new Date();
    await otpRecord.save();
    throw error;
  }

  return { sent: true };
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

exports.sendLoginOtp = async ({ email }) => {
  const user = await findLoginUser(email);
  return createLoginOtp(user);
};

exports.resendLoginOtp = async ({ email }) => {
  const user = await findLoginUser(email);
  return createLoginOtp(user);
};

exports.verifyLoginOtp = async ({ email, otp, purpose }) => {
  if (purpose !== "LOGIN") {
    const error = new Error("Invalid OTP purpose.");
    error.statusCode = 400;
    throw error;
  }
  const user = await findLoginUser(email);
  const enteredOtp = typeof otp === "string" ? otp : "";
  if (!/^\d{6}$/.test(enteredOtp)) {
    const error = new Error("Enter a valid 6-digit login code.");
    error.statusCode = 400;
    throw error;
  }
  const otpRecord = await Otp.findOne({
    phone: user.phone,
    purpose: "LOGIN",
    userId: user._id,
    usedAt: null,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 },
  });
  if (!otpRecord) {
    throw new Error("Login code is invalid, expired, or already used. Request a new code.");
  }

  const expectedHash = loginOtpHash(user._id, enteredOtp);
  const storedHash = Buffer.from(otpRecord.otp, "hex");
  const suppliedHash = Buffer.from(expectedHash, "hex");
  if (storedHash.length !== suppliedHash.length ||
      !crypto.timingSafeEqual(storedHash, suppliedHash)) {
    await Otp.updateOne({ _id: otpRecord._id, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } });
    throw new Error("Invalid login code.");
  }

  const consumedOtp = await Otp.findOneAndDelete({
    _id: otpRecord._id,
    otp: expectedHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 5 },
  });
  if (!consumedOtp) {
    throw new Error("Login code is invalid, expired, or already used. Request a new code.");
  }

  if (!user.password) {
    const passwordSetupToken = jwt.sign(
      { userId: user._id, purpose: "CREATE_LOGIN_PASSWORD" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    return { requiresPassword: true, passwordSetupToken };
  }

  return createLoginSession(user);
};

exports.createLoginPassword = async ({ passwordSetupToken, password, confirmPassword }) => {
  let challenge;
  try {
    challenge = jwt.verify(passwordSetupToken, process.env.JWT_SECRET);
  } catch {
    const error = new Error("Password setup session has expired. Please request a new login OTP.");
    error.statusCode = 401;
    throw error;
  }

  if (challenge.purpose !== "CREATE_LOGIN_PASSWORD" || !challenge.userId) {
    const error = new Error("Invalid password setup session.");
    error.statusCode = 401;
    throw error;
  }
  if (typeof password !== "string" || password.length < 8 ||
      !/[A-Z]/.test(password) || !/[a-z]/.test(password) ||
      !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
    const error = new Error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
    error.statusCode = 400;
    throw error;
  }
  if (password !== confirmPassword) {
    const error = new Error("Passwords do not match.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    _id: challenge.userId,
    role: "customer",
    isEnabled: true,
    status: "Active",
  });
  if (!user) {
    const error = new Error("Account is not active.");
    error.statusCode = 403;
    throw error;
  }
  if (user.password) {
    const error = new Error("A password has already been created for this account.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, password: null, isEnabled: true, status: "Active" },
    { $set: { password: hashedPassword } },
    { new: true }
  );
  if (!updatedUser) {
    const error = new Error("Password could not be created for this account. Please try again.");
    error.statusCode = 409;
    throw error;
  }

  return createLoginSession(updatedUser);
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