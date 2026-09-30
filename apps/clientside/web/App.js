import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AdminAuthProvider } from "./src/context/AdminAuthContext";
import AdminNavigator from "./src/navigation/AdminNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AdminAuthProvider>
        <StatusBar style="dark" />
        <AdminNavigator />
      </AdminAuthProvider>
    </SafeAreaProvider>
  );
}
