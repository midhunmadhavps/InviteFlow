import api from "../../../api/client";

export const getRegistrationSettings = async () => {
  const response = await api.get("/auth/registration-settings");
  return response.data;
};

export const requestLoginOtp = async (data) => {
  const response = await api.post("/auth/login/request-otp", data);
  return response.data;
};

export const verifyLoginOtp = async (data) => {
  const response = await api.post("/auth/login/verify-otp", data);
  return response.data;
};

export const resendLoginOtp = async (data) => {
  const response = await api.post("/auth/login/resend-otp", data);
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);

  return response.data;
};

export const verifyOtp = async (data) => {
  const response = await api.post("/auth/verify-otp", data);

  return response.data;
};

export const resendOtp = async (data) => {
  const response = await api.post("/auth/resend-otp", data);

  return response.data;
};

export const setPasswordUser = async (data) => {
  const response = await api.post("/auth/set-password", data);

  return response.data;
};

export const forgotPasswordUser = async (data) => {
  const response = await api.post("/auth/forgot-password", data);

  return response.data;
};