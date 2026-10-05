import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

import {
  getToken,
  removeToken,
  isTokenExpired,
} from "../../../utils/auth";
import { useToast } from "../../../context/ToastContext";
import { useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function AuthLoadingScreen({ navigation }) {
  const { colors } = useAppTheme();
  useEffect(() => {
    checkAuth();
  }, []);

    const { showError } = useToast();

    const checkAuth = async () => {
        try {
        const token = await getToken();

        // No token
        if (!token) {
            navigation.replace("Welcome");
            return;
        }

        // Token expired
        if (isTokenExpired(token)) {
            await removeToken();
            showError("Token expired");
            navigation.replace("Welcome");
            return;
        }

        // Token is valid
        navigation.replace("Main");
        } catch (error) {
        console.log("Auth check error:", error);

        await removeToken();
        navigation.replace("Welcome");
        }
    };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.textMuted} />
    </View>
  );
}