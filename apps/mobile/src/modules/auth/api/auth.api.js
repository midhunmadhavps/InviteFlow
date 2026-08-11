import api from "../../../api/client";

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

export const setPassword = async (data) => {
  const response = await api.post("/auth/set-password", data);

  return response.data;
};