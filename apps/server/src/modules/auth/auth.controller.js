const authService = require("./auth.service");

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: "User registered successfully. OTP has been sent to your phone.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const result = await authService.verifyOtp(req.body);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const result = await authService.resendOtp(req.body);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const setpassword = async (req, res) => {
  try {
    const result = await authService.setpassword(req.body);
    return res.status(201).json({
      success: true,
      message: "Password successfully created.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
     const result = await authService.forgotPassword(req.body);
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully.",
            data: result
        });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json({
        success: true,
        message: "Password updated successfully.",
        data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  setpassword,
  login,
  forgotPassword,
  resetPassword
};