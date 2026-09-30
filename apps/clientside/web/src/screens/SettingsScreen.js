import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSettingsApi } from "../api/admin.api";

const SettingsScreen = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSettingsApi();
      if (res.success && res.data) {
        setSettings(res.data);
        setAutoApprove(res.data.autoApproveCustomers);
        setMaintenance(res.data.maintenanceMode);
        setAllowRegistration(res.data.allowRegistration);
      }
    } catch (err) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading system settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>System Settings & Security Policy</Text>
          <Text style={styles.headerSubtitle}>
            Global application parameters, operational controls, and administrative thresholds
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* General Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Platform Operations</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Customer registration and account approval workflows
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingMeta}>
            <Text style={styles.settingTitle}>Auto-Approve Customer Accounts</Text>
            <Text style={styles.settingDesc}>
              When enabled, customer accounts become Active immediately upon OTP verification without admin review.
            </Text>
          </View>
          <Switch
            value={autoApprove}
            onValueChange={setAutoApprove}
            trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
            thumbColor={autoApprove ? "#4F46E5" : "#FFFFFF"}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingMeta}>
            <Text style={styles.settingTitle}>Allow New Customer Registrations</Text>
            <Text style={styles.settingDesc}>
              Allow new customers to sign up from the mobile application.
            </Text>
          </View>
          <Switch
            value={allowRegistration}
            onValueChange={setAllowRegistration}
            trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
            thumbColor={allowRegistration ? "#4F46E5" : "#FFFFFF"}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingMeta}>
            <Text style={styles.settingTitle}>Platform Maintenance Mode</Text>
            <Text style={styles.settingDesc}>
              Temporarily restrict customer mobile app access during scheduled maintenance.
            </Text>
          </View>
          <Switch
            value={maintenance}
            onValueChange={setMaintenance}
            trackColor={{ false: "#CBD5E1", true: "#FCA5A5" }}
            thumbColor={maintenance ? "#EF4444" : "#FFFFFF"}
          />
        </View>
      </View>

      {/* Security Policies */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Enforced Security Parameters</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Hardened authentication constraints configured on server
        </Text>

        <View style={styles.policyGrid}>
          <View style={styles.policyItem}>
            <Text style={styles.policyLabel}>Admin OTP Expiry</Text>
            <Text style={styles.policyValue}>{settings?.otpExpiryMinutes || 5} Minutes</Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyLabel}>Max OTP Verification Attempts</Text>
            <Text style={styles.policyValue}>{settings?.maxLoginAttempts || 5} Attempts</Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyLabel}>Admin Role Enforcement</Text>
            <Text style={styles.policyValue}>Backend Middleware Protected</Text>
          </View>
          <View style={styles.policyItem}>
            <Text style={styles.policyLabel}>Support Desk Contact</Text>
            <Text style={styles.policyValue}>{settings?.supportEmail || "support@inviteflow.com"}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    padding: 24,
    gap: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 16,
  },
  settingMeta: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  settingDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  policyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  policyItem: {
    flex: 1,
    minWidth: 220,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  policyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  policyValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
});

export default SettingsScreen;
