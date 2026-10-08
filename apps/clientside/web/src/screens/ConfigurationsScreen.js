import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Sub-views
import WhatsAppLoginsScreen from "./WhatsAppLoginsScreen";
import SettingsScreen from "./SettingsScreen";

const ConfigurationsScreen = () => {
  const [activeConfigTab, setActiveConfigTab] = useState("whatsapp");

  const tabs = [
    { key: "whatsapp", label: "WhatsApp Gateway", icon: "whatsapp" },
    { key: "sms", label: "Email & SMS", icon: "message-text-outline" },
    { key: "settings", label: "System Settings", icon: "cog-outline" },
  ];

  return (
    <View style={styles.container}>
      {/* Tab Selector Header */}
      <View style={styles.topTabBar}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeConfigTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveConfigTab(tab.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={18}
                  color={isActive ? "#4F46E5" : "#64748B"}
                />
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Screen Content */}
      <View style={styles.contentArea}>
        {activeConfigTab === "whatsapp" && <WhatsAppLoginsScreen />}
        {activeConfigTab === "sms" && <SettingsScreen configSection="sms" />}
        {activeConfigTab === "settings" && <SettingsScreen />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topTabBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: "#4F46E5",
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabBtnTextActive: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  contentArea: {
    flex: 1,
  },
});

export default ConfigurationsScreen;
