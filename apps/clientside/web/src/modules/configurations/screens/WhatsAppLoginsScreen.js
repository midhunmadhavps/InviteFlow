import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StatusBadge from "../../../components/StatusBadge";
import {
  getWhatsAppDetailsApi,
  saveWhatsAppDetailsApi,
} from "../api/configuration.api";

const WhatsAppLoginsScreen = () => {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    accessToken: "",
    phoneNumberId: "",
    verifyToken: "",
    businessAccountId: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getWhatsAppDetailsApi();
      if (res.success && res.data) {
        setData(res.data);
        setForm((current) => ({
          ...current,
          phoneNumberId: res.data.phoneNumberId || "",
          businessAccountId: res.data.businessAccountId || "",
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load WhatsApp gateway configuration.");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await saveWhatsAppDetailsApi(form);
      if (response.success && response.data) {
        setData(response.data);
        setForm((current) => ({
          ...current,
          accessToken: "",
          verifyToken: "",
          phoneNumberId: response.data.phoneNumberId || "",
          businessAccountId: response.data.businessAccountId || "",
        }));
      }
      setSuccessMessage(response.message || "WhatsApp configuration saved.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save WhatsApp configuration.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Fetching WhatsApp gateway configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>WhatsApp Cloud API Configuration</Text>
          <Text style={styles.headerSubtitle}>
            Review the credentials and IDs used by the WhatsApp Business Platform
          </Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={loadData}>
          <MaterialCommunityIcons name="sync" size={18} color="#16A34A" />
          <Text style={styles.syncBtnText}>Sync Health</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {successMessage ? (
        <View style={styles.successBanner}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#15803D" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Connection Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.waIconWrapper}>
              <MaterialCommunityIcons name="whatsapp" size={24} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Connection credentials</Text>
              <Text style={styles.cardSubtitle}>
                Save these credentials securely for WhatsApp message delivery
              </Text>
            </View>
          </View>
          <StatusBadge status={data?.health || "Operational"} />
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Phone Number ID</Text>
            <TextInput
              style={styles.configInput}
              value={form.phoneNumberId}
              onChangeText={(value) => updateField("phoneNumberId", value)}
              placeholder="Enter Phone Number ID"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.metaDescription}>
              Identifies the WhatsApp Business phone number that sends messages.
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>WhatsApp Business Account ID (WABA ID)</Text>
            <TextInput
              style={styles.configInput}
              value={form.businessAccountId}
              onChangeText={(value) => updateField("businessAccountId", value)}
              placeholder="Enter WhatsApp Business Account ID"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.metaDescription}>
              Identifies your WhatsApp Business Account.
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>WhatsApp Access Token</Text>
            <TextInput
              style={styles.configInput}
              value={form.accessToken}
              onChangeText={(value) => updateField("accessToken", value)}
              placeholder={
                data?.accessTokenConfigured
                  ? "Configured; enter to replace"
                  : "Enter WhatsApp Access Token"
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.metaDescription}>
              Authenticates the backend when it sends messages. Existing token values
              are never returned to this page; leave blank to keep the current token.
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Webhook Verify Token (optional for sending)</Text>
            <TextInput
              style={styles.configInput}
              value={form.verifyToken}
              onChangeText={(value) => updateField("verifyToken", value)}
              placeholder={
                data?.verifyTokenConfigured
                  ? "Configured; enter to replace"
                  : "Enter Webhook Verify Token"
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.metaDescription}>
              A token you create to verify webhook requests when receiving incoming
              messages. It is not required for sending. Leave blank to keep the current
              token.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveConfig}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save WhatsApp Configuration</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Features Support List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Supported Invitation Capabilities</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Gateway capabilities active for invitation distribution
        </Text>

        <View style={styles.featureList}>
          {data?.features?.map((feat, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureLeft}>
                <MaterialCommunityIcons
                  name={feat.enabled ? "check-circle" : "close-circle"}
                  size={20}
                  color={feat.enabled ? "#16A34A" : "#94A3B8"}
                />
                <Text style={styles.featureName}>{feat.name}</Text>
              </View>
              <StatusBadge status={feat.enabled ? "Enabled" : "Disabled"} />
            </View>
          ))}
        </View>
      </View>

      {/* Security Best Practices Card */}
      <View style={[styles.card, styles.securityCard]}>
        <View style={styles.securityHeader}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#0284C7" />
          <Text style={styles.securityTitle}>Security Compliance Notice</Text>
        </View>
        <Text style={styles.securityText}>
          Credentials are stored in the server-side whatsapp_config collection. Secret
          values are never returned to the browser. Restrict database access and use
          encrypted backups.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    fontWeight: "500",
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
    flexWrap: "wrap",
    gap: 12,
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
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  waIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
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
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metaItem: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaDescription: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
    marginTop: 7,
  },
  configInput: {
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 14,
  },
  saveButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: "#16A34A",
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  featureLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  securityCard: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
  },
  securityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0369A1",
  },
  securityText: {
    fontSize: 13,
    color: "#0C4A6E",
    lineHeight: 20,
  },
});

export default WhatsAppLoginsScreen;
