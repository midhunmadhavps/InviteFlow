import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AdminAuthProvider } from "./src/context/AdminAuthContext";
import AdminNavigator from "./src/navigation/AdminNavigator";
import { ThemeProvider } from "./src/shared/theme/ThemeContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AdminAuthProvider>
          <StatusBar style="auto" />
          <AdminNavigator />
        </AdminAuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
