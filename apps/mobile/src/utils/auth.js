import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "authToken";
const USER_KEY = "user";

export const saveUser = async (user) => {
  try {
    const value = JSON.stringify(user);

    if (Platform.OS === "web") {
      localStorage.setItem(USER_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(USER_KEY, value);
  } catch (error) {
    console.log("Error saving user:", error);
  }
};

export const getUser = async () => {
  try {
    if (Platform.OS === "web") {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }

    const user = await SecureStore.getItemAsync(USER_KEY);

    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.log("Error getting user:", error);
    return null;
  }
};

export const removeUser = async () => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(USER_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.log("Error removing user:", error);
  }
};

export const saveToken = async (token) => {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.log("Error saving token:", error);
  }
};

export const getToken = async () => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }

    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.log("Error getting token:", error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.log("Error removing token:", error);
  }
};

export const isTokenExpired = (token) => {
  try {
    const payload = jwtDecode(token);

    if (!payload.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  } catch (error) {
    console.log("Invalid token:", error);
    return true;
  }
};