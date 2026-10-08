import React, { useState, useEffect, useRef } from "react";
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
  getSystemConfigApi,
  getSmsConfigApi,
  saveEmailConfigApi,
  saveSystemConfigApi,
  saveSmsConfigApi,
} from "../api/admin.api";

const EMPTY_SYSTEM_CONFIG = {
  name: "",
  email: "",
  phone: "",
  address: "",
  logo: "",
};

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
  const [systemConfig, setSystemConfig] = useState(EMPTY_SYSTEM_CONFIG);
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
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const scrollViewRef = useRef(null);
  const logoInput = useRef(null);

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      if (configSection === "email") {
        const response = await getEmailConfigApi();
        const emailData = response.data || {};
        setEmailConfig({
          ...EMPTY_EMAIL_CONFIG,
          ...emailData.config,
          port: emailData.config?.port == null ? "" : String(emailData.config.port),
        });
        setEmailConfiguredSecrets(emailData.configuredSecrets || {});
      } else if (configSection === "sms") {
        const [emailResponse, smsResponse] = await Promise.all([
          getEmailConfigApi(),
          getSmsConfigApi(),
        ]);

        const emailData = emailResponse.data || {};
        setEmailConfig({
          ...EMPTY_EMAIL_CONFIG,
          ...emailData.config,
          port: emailData.config?.port == null ? "" : String(emailData.config.port),
        });
        setEmailConfiguredSecrets(emailData.configuredSecrets || {});

        const smsData = smsResponse.data || {};
        setSmsConfig({
          ...EMPTY_SMS_CONFIG,
          ...smsData.config,
          port: smsData.config?.port == null ? "" : String(smsData.config.port),
        });
        setSmsConfiguredSecrets(smsData.configuredSecrets || {});
      } else {
        const [settingsResponse, systemConfigResponse] = await Promise.all([
          getSettingsApi(),
          getSystemConfigApi(),
        ]);
        if (settingsResponse.success && settingsResponse.data) {
          setSettings(settingsResponse.data);
          setAutoApprove(settingsResponse.data.autoApproveCustomers);
          setMaintenance(settingsResponse.data.maintenanceMode);
          setAllowRegistration(settingsResponse.data.allowRegistration);
        }
        setSystemConfig({
          ...EMPTY_SYSTEM_CONFIG,
          ...(systemConfigResponse.data || {}),
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!selectedLogo) {
      setLogoPreviewUrl("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(selectedLogo);
    setLogoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedLogo]);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeoutId = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const updateConfigField = (setter, key, value) => {
    setter((current) => ({ ...current, [key]: value }));
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
      scrollToTop();
    }
  };

  const saveSystemDetails = async () => {
    if (selectedLogo && !/^image\/(jpeg|png|webp)$/.test(selectedLogo.type)) {
      setError("Logo must be a JPG, PNG, or WEBP image.");
      scrollToTop();
      return;
    }
    if (selectedLogo && selectedLogo.size > 5 * 1024 * 1024) {
      setError("Logo must be 5 MB or smaller.");
      scrollToTop();
      return;
    }

    setSavingConfig("system");
    setError("");
    setSuccessMessage("");
    try {
      const payload = new FormData();
      ["name", "email", "phone", "address"].forEach((field) => {
        payload.append(field, systemConfig[field]);
      });
      if (selectedLogo) payload.append("logo", selectedLogo);

      const response = await saveSystemConfigApi(payload);
      setSystemConfig({ ...EMPTY_SYSTEM_CONFIG, ...(response.data || {}) });
      setSelectedLogo(null);
      setSuccessMessage(response.message || "System details saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save system details.");
    } finally {
      setSavingConfig("");
      scrollToTop();
    }
  };

  const getLogoUrl = (logo) => {
    if (!logo) return "";
    if (/^https?:\/\//i.test(logo)) return logo;
    if (logo.startsWith("/uploads/")) return `http://localhost:3000${logo}`;
    return `http://localhost:3000/uploads/${encodeURIComponent(logo)}`;
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
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            {configSection === "email"
              ? "Email Configuration"
              : configSection === "sms"
                ? "Email & SMS Configuration"
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

      {(configSection === "email" || configSection === "sms") && <View style={styles.card}>
        <View style={styles.configHeading}>
          <View style={styles.configHeadingIcon}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#4F46E5" />
          </View>
          <View style={styles.configHeadingText}>
            <Text style={styles.cardTitle}>Email Configuration</Text>
            <Text style={styles.cardSubtitle}>SMTP provider and sender details</Text>
          </View>
          {(configSection === "email" || configSection === "sms") && (
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

      {configSection === "sms" && <View style={styles.card}>
        <View style={styles.configHeading}>
          <View style={styles.configHeadingIcon}>
            <MaterialCommunityIcons name="message-text-outline" size={20} color="#4F46E5" />
          </View>
          <View style={styles.configHeadingText}>
            <Text style={styles.cardTitle}>SMS Configuration</Text>
            <Text style={styles.cardSubtitle}>SMS gateway connection and credentials</Text>
          </View>
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
        <Text style={styles.cardTitle}>System Details</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Contact information and branding for your platform
        </Text>

        <View style={styles.configGrid}>
          {[
            { key: "name", label: "Name", placeholder: "System name" },
            { key: "email", label: "Email", placeholder: "contact@example.com", keyboardType: "email-address" },
            { key: "phone", label: "Phone", placeholder: "Contact phone", keyboardType: "phone-pad" },
          ].map((field) => (
            <View key={field.key} style={styles.configField}>
              <Text style={styles.configLabel}>{field.label}</Text>
              <TextInput
                style={styles.configInput}
                value={systemConfig[field.key]}
                onChangeText={(value) => updateConfigField(setSystemConfig, field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={field.keyboardType || "default"}
                autoCapitalize={field.key === "email" ? "none" : "sentences"}
              />
            </View>
          ))}
          <View style={styles.configField}>
            <Text style={styles.configLabel}>Address</Text>
            <TextInput
              style={[styles.configInput, styles.addressInput]}
              value={systemConfig.address}
              onChangeText={(value) => updateConfigField(setSystemConfig, "address", value)}
              placeholder="System address"
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.logoField}>
          <Text style={styles.configLabel}>Logo</Text>
          <input
            ref={logoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={styles.hiddenFileInput}
            onChange={(event) => setSelectedLogo(event.target.files?.[0] || null)}
          />
          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={() => logoInput.current?.click()}
          >
            <MaterialCommunityIcons name="image-outline" size={18} color="#4F46E5" />
            <Text style={styles.filePickerButtonText}>Choose logo</Text>
          </TouchableOpacity>
          <Text style={styles.fileName} numberOfLines={1}>
            {selectedLogo?.name || (systemConfig.logo ? "Current logo" : "No logo selected")}
          </Text>
          {(logoPreviewUrl || systemConfig.logo) ? (
            <img
              src={logoPreviewUrl || getLogoUrl(systemConfig.logo)}
              alt={selectedLogo?.name || "System logo preview"}
              style={styles.logoPreview}
            />
          ) : null}
          <Text style={styles.logoHint}>JPG, PNG, or WEBP; maximum 5 MB.</Text>
        </View>

        <View style={styles.configFooter}>
          <TouchableOpacity
            style={styles.saveConfigButton}
            onPress={saveSystemDetails}
            disabled={Boolean(savingConfig)}
          >
            <Text style={styles.saveConfigButtonText}>
              {savingConfig === "system" ? "Saving..." : "Save System Details"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>}

      {!configSection && <View style={styles.card}>
        <Text style={styles.cardTitle}>Mobile settings</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Mobile app access and registration controls
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingMeta}>
            <Text style={styles.settingTitle}>Registration enable</Text>
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
      </View>}

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
  addressInput: {
    minHeight: 84,
    paddingTop: 10,
  },
  mobileSettingsSection: {
    marginTop: 18,
    gap: 8,
  },
  logoField: {
    alignItems: "flex-start",
    gap: 8,
    marginTop: 18,
  },
  hiddenFileInput: {
    display: "none",
  },
  filePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  filePickerButtonText: {
    color: "#4338CA",
    fontSize: 13,
    fontWeight: "600",
  },
  fileName: {
    maxWidth: "100%",
    color: "#64748B",
    fontSize: 12,
  },
  logoPreview: {
    width: 112,
    height: 112,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    objectFit: "contain",
    backgroundColor: "#FFFFFF",
  },
  logoHint: {
    color: "#64748B",
    fontSize: 12,
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
