import { jwtDecode } from "jwt-decode";

const ADMIN_TOKEN_KEY = "inviteflow_admin_token";
const ADMIN_USER_KEY = "inviteflow_admin_user";

export const saveAdminToken = async (token) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("Error saving admin token:", error);
  }
};

export const getAdminToken = async () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(ADMIN_TOKEN_KEY);
    }
    return null;
  } catch (error) {
    console.error("Error getting admin token:", error);
    return null;
  }
};

export const removeAdminToken = async () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch (error) {
    console.error("Error removing admin token:", error);
  }
};

export const saveAdminUser = async (user) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Error saving admin user:", error);
  }
};

export const getAdminUser = async () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const data = window.localStorage.getItem(ADMIN_USER_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  } catch (error) {
    console.error("Error getting admin user:", error);
    return null;
  }
};

export const removeAdminUser = async () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(ADMIN_USER_KEY);
    }
  } catch (error) {
    console.error("Error removing admin user:", error);
  }
};

export const isAdminTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch (error) {
    return true;
  }
};
