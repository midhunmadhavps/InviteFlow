import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getEmailConfigApi,
  getSettingsApi,
  getSmsConfigApi,
  saveEmailConfigApi,
  saveSmsConfigApi,
} from "../api/admin.api";

const EMPTY_EMAIL_CONFIG = {
  provider: "",
  host: "",
  port: "",
  username: "",
  password: "",
  api_key: "",
  from_email: "",
  from_name: "",
  encryption: "",
  is_active: false,
};

const EMPTY_SMS_CONFIG = {
  provider: "",
  api_url: "",
  api_key: "",
  api_secret: "",
  sender_id: "",
  host: "",
  port: "",
  username: "",
  password: "",
  is_active: false,
};

const SettingsScreen = ({ configSection }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [emailConfig, setEmailConfig] = useState(EMPTY_EMAIL_CONFIG);
  const [smsConfig, setSmsConfig] = useState(EMPTY_SMS_CONFIG);
  const [emailConfiguredSecrets, setEmailConfiguredSecrets] = useState({});
  const [smsConfiguredSecrets, setSmsConfiguredSecrets] = useState({});
  const [savingConfig, setSavingConfig] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const [settingsResponse, emailResponse, smsResponse] = await Promise.all([
        getSettingsApi(),
        getEmailConfigApi(),
        getSmsConfigApi(),
      ]);
      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
        setAutoApprove(settingsResponse.data.autoApproveCustomers);
        setMaintenance(settingsResponse.data.maintenanceMode);
        setAllowRegistration(settingsResponse.data.allowRegistration);
      }
      const emailData = emailResponse.data || {};
      const smsData = smsResponse.data || {};
      setEmailConfig({
        ...EMPTY_EMAIL_CONFIG,
        ...emailData.config,
        port: emailData.config?.port == null ? "" : String(emailData.config.port),
      });
      setSmsConfig({
        ...EMPTY_SMS_CONFIG,
        ...smsData.config,
        port: smsData.config?.port == null ? "" : String(smsData.config.port),
      });
      setEmailConfiguredSecrets(emailData.configuredSecrets || {});
      setSmsConfiguredSecrets(smsData.configuredSecrets || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateConfigField = (setter, key, value) => {
    setter((current) => ({ ...current, [key]: value }));
  };

  const saveConfig = async (type) => {
    setSavingConfig(type);
    setError("");
    setSuccessMessage("");
    try {
      const response = type === "email"
        ? await saveEmailConfigApi(emailConfig)
        : await saveSmsConfigApi(smsConfig);
      const saved = response.data || {};
      if (type === "email") {
        setEmailConfig((current) => ({
          ...current,
          ...saved.config,
          password: "",
          api_key: "",
          port: saved.config?.port == null ? "" : String(saved.config.port),
        }));
        setEmailConfiguredSecrets(saved.configuredSecrets || {});
      } else {
        setSmsConfig((current) => ({
          ...current,
          ...saved.config,
          password: "",
          api_key: "",
          api_secret: "",
          port: saved.config?.port == null ? "" : String(saved.config.port),
        }));
        setSmsConfiguredSecrets(saved.configuredSecrets || {});
      }
      setSuccessMessage(response.message || `${type.toUpperCase()} configuration saved.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to save ${type} configuration.`);
    } finally {
      setSavingConfig("");
    }
  };

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
          <Text style={styles.headerTitle}>
            {configSection === "email"
              ? "Email Configuration"
              : configSection === "sms"
                ? "SMS Configuration"
                : "System Settings & Security Policy"}
          </Text>
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

      {successMessage ? (
        <View style={styles.successBanner}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {(!configSection || configSection === "email") && <View style={styles.card}>
        <View style={styles.configHeading}>
          <View style={styles.configHeadingIcon}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#4F46E5" />
          </View>
          <View style={styles.configHeadingText}>
            <Text style={styles.cardTitle}>Email Configuration</Text>
            <Text style={styles.cardSubtitle}>SMTP provider and sender details</Text>
          </View>
          {configSection !== "sms" && (
            <View style={styles.configToggle}>
              <Text style={styles.configToggleLabel}>
                {emailConfig.is_active ? "Enabled" : "Disabled"}
              </Text>
              <Switch
                value={emailConfig.is_active}
                onValueChange={(value) => updateConfigField(setEmailConfig, "is_active", value)}
                trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
                thumbColor={emailConfig.is_active ? "#4F46E5" : "#FFFFFF"}
              />
            </View>
          )}
        </View>
        <View style={styles.configGrid}>
          {[
            { key: "provider", label: "Provider", placeholder: "SMTP provider" },
            { key: "host", label: "Host", placeholder: "smtp.example.com" },
            { key: "port", label: "Port", placeholder: "587", keyboardType: "numeric" },
            { key: "username", label: "Username", placeholder: "SMTP username" },
            { key: "password", label: "Password", placeholder: emailConfiguredSecrets.password ? "Saved; leave blank to keep it" : "SMTP password", secure: true },
            { key: "api_key", label: "API key", placeholder: emailConfiguredSecrets.api_key ? "Saved; leave blank to keep it" : "Email provider API key", secure: true },
            { key: "from_email", label: "Sender email", placeholder: "sender@example.com", keyboardType: "email-address" },
            { key: "from_name", label: "Sender name", placeholder: "InviteFlow" },
            { key: "encryption", label: "Encryption", placeholder: "TLS, SSL, or none" },
          ].map((field) => (
            <View key={field.key} style={styles.configField}>
              <Text style={styles.configLabel}>{field.label}</Text>
              <TextInput
                style={styles.configInput}
                value={emailConfig[field.key]}
                onChangeText={(value) => updateConfigField(setEmailConfig, field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={field.keyboardType || "default"}
                autoCapitalize={field.key === "from_email" ? "none" : "sentences"}
                secureTextEntry={field.secure || false}
              />
            </View>
          ))}
        </View>
        <View style={styles.configFooter}>
          <TouchableOpacity
            style={styles.saveConfigButton}
            onPress={() => saveConfig("email")}
            disabled={Boolean(savingConfig)}
          >
            <Text style={styles.saveConfigButtonText}>
              {savingConfig === "email" ? "Saving..." : "Save Email Configuration"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>}

      {(!configSection || configSection === "sms") && <View style={styles.card}>
        <View style={styles.configHeading}>
          <View style={styles.configHeadingIcon}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color="#4F46E5" />
          </View>
          <View style={styles.configHeadingText}>
            <Text style={styles.cardTitle}>SMS Configuration</Text>
            <Text style={styles.cardSubtitle}>SMS gateway connection and credentials</Text>
          </View>
          {configSection !== "email" && (
            <View style={styles.configToggle}>
              <Text style={styles.configToggleLabel}>
                {smsConfig.is_active ? "Enabled" : "Disabled"}
              </Text>
              <Switch
                value={smsConfig.is_active}
                onValueChange={(value) => updateConfigField(setSmsConfig, "is_active", value)}
                trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
                thumbColor={smsConfig.is_active ? "#4F46E5" : "#FFFFFF"}
              />
            </View>
          )}
        </View>
        <View style={styles.configGrid}>
          {[
            { key: "provider", label: "Provider", placeholder: "SMS provider" },
            { key: "api_url", label: "API URL", placeholder: "https://sms-provider.example/api" },
            { key: "api_key", label: "API key", placeholder: smsConfiguredSecrets.api_key ? "Saved; leave blank to keep it" : "SMS provider API key", secure: true },
            { key: "api_secret", label: "API secret", placeholder: smsConfiguredSecrets.api_secret ? "Saved; leave blank to keep it" : "SMS provider API secret", secure: true },
            { key: "sender_id", label: "Sender ID", placeholder: "INVITEFLOW" },
            { key: "host", label: "Host", placeholder: "SMS gateway host" },
            { key: "port", label: "Port", placeholder: "443", keyboardType: "numeric" },
            { key: "username", label: "Username", placeholder: "SMS gateway username" },
            { key: "password", label: "Password", placeholder: smsConfiguredSecrets.password ? "Saved; leave blank to keep it" : "SMS gateway password", secure: true },
          ].map((field) => (
            <View key={field.key} style={styles.configField}>
              <Text style={styles.configLabel}>{field.label}</Text>
              <TextInput
                style={styles.configInput}
                value={smsConfig[field.key]}
                onChangeText={(value) => updateConfigField(setSmsConfig, field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={field.keyboardType || "default"}
                autoCapitalize="none"
                secureTextEntry={field.secure || false}
              />
            </View>
          ))}
        </View>
        <View style={styles.configFooter}>
          <TouchableOpacity
            style={styles.saveConfigButton}
            onPress={() => saveConfig("sms")}
            disabled={Boolean(savingConfig)}
          >
            <Text style={styles.saveConfigButtonText}>
              {savingConfig === "sms" ? "Saving..." : "Save SMS Configuration"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>}

      {/* General Configuration */}
      {!configSection && <View style={styles.card}>
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
      </View>}

      {/* Security Policies */}
      {!configSection && <View style={styles.card}>
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
      </View>}
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
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  successText: {
    color: "#15803D",
    fontSize: 13,
    fontWeight: "600",
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
  configHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  configToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  configToggleLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  configHeadingIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
  },
  configHeadingText: {
    flex: 1,
  },
  configGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  configField: {
    flexGrow: 1,
    flexBasis: 260,
    gap: 6,
  },
  configLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  configInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 14,
    outlineStyle: "none",
  },
  configFooter: {
    marginTop: 14,
    gap: 14,
  },
  saveConfigButton: {
    alignSelf: "flex-end",
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  saveConfigButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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
