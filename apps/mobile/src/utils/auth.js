import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "authToken";

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.log("Error saving user:", error);
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.log("Error getting user:", error);
    return null;
  }
};

export const removeUser = async () => {
  await AsyncStorage.removeItem("user");
};

export const saveToken = async (token) => {
  if (Platform.OS === "web") {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem(TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
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