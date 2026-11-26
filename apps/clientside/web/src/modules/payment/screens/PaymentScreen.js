import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StatusBadge from "../../../components/StatusBadge";
import {
  getPaymentGatewayConfigApi,
  savePaymentGatewayConfigApi,
} from "../../configurations/api/configuration.api";

const PaymentScreen = () => {
  const [enabled, setEnabled] = useState(false);
  const [credentials, setCredentials] = useState({
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayWebhookSecret: "",
    phonepeClientId: "",
    phonepeClientSecret: "",
    phonepeClientVersion: "1",
    phonepeWebhookUsername: "",
    phonepeWebhookPassword: "",
    paypalClientId: "",
    paypalClientSecret: "",
    paypalWebhookId: "",
    paypalEnvironment: "sandbox",
  });
  const [providerEnabled, setProviderEnabled] = useState({
    razorpay: false,
    phonepe: false,
    paypal: false,
  });
  const [primaryProvider, setPrimaryProvider] = useState(null);
  const [configured, setConfigured] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getPaymentGatewayConfigApi()
      .then((response) => {
        if (active) setEnabled(response.data?.enabled === true);
        if (active) {
          setConfigured(response.data?.credentials || {});
          setProviderEnabled({
            razorpay: false,
            phonepe: false,
            paypal: false,
            ...response.data?.providerEnabled,
          });
          setPrimaryProvider(response.data?.primaryProvider || null);
          setCredentials((current) => ({
            ...current,
            phonepeClientVersion: response.data?.phonepeClientVersion || "1",
            paypalEnvironment: response.data?.paypalEnvironment || "sandbox",
          }));
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load payment gateway settings."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateEnabled = async (nextEnabled) => {
    const previousEnabled = enabled;
    setEnabled(nextEnabled);
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await savePaymentGatewayConfigApi({
        enabled: nextEnabled,
      });
      setEnabled(response.data?.enabled === true);
      setSuccess(response.message || "Payment gateway setting saved.");
    } catch (saveError) {
      setEnabled(previousEnabled);
      setError(
        saveError.response?.data?.message ||
          saveError.message ||
          "Failed to save payment gateway setting."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateCredential = (field, value) => {
    setCredentials((current) => ({ ...current, [field]: value }));
  };

  const updateProviderEnabled = (provider, isEnabled) => {
    const next = { ...providerEnabled, [provider]: isEnabled };
    setProviderEnabled(next);
    if (isEnabled && !primaryProvider) {
      setPrimaryProvider(provider);
    } else if (!isEnabled && primaryProvider === provider) {
      setPrimaryProvider(Object.keys(next).find((key) => next[key]) || null);
    }
  };

  const renderProviderSettings = (provider, providerLabel) => (
    <View style={styles.providerSettings}>
      <View style={styles.providerEnableControl}>
        <Text style={styles.inputLabel}>Enable {providerLabel}</Text>
        <Switch
          value={providerEnabled[provider]}
          onValueChange={(value) => updateProviderEnabled(provider, value)}
          disabled={saving}
          accessibilityLabel={`Enable ${providerLabel}`}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.primaryButton,
          primaryProvider === provider && styles.primaryButtonSelected,
          (!providerEnabled[provider] || saving) && styles.primaryButtonDisabled,
        ]}
        onPress={() => setPrimaryProvider(provider)}
        disabled={!providerEnabled[provider] || saving}
        accessibilityRole="button"
        accessibilityState={{
          selected: primaryProvider === provider,
          disabled: !providerEnabled[provider] || saving,
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={
            primaryProvider === provider
              ? "radiobox-marked"
              : "radiobox-blank"
          }
          size={19}
          color={primaryProvider === provider ? "#4F46E5" : "#64748B"}
        />
        <Text
          style={[
            styles.primaryButtonText,
            primaryProvider === provider && styles.primaryButtonTextSelected,
          ]}
        >
          {primaryProvider === provider ? "Primary" : "Set as primary"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const saveCredentials = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await savePaymentGatewayConfigApi({
        ...credentials,
        enabled,
        providerEnabled,
        primaryProvider,
      });
      setConfigured(response.data?.credentials || {});
      setProviderEnabled(response.data?.providerEnabled || providerEnabled);
      setPrimaryProvider(response.data?.primaryProvider || null);
      setCredentials((current) => ({
        ...current,
        razorpayKeyId: "",
        razorpayKeySecret: "",
        razorpayWebhookSecret: "",
        phonepeClientId: "",
        phonepeClientSecret: "",
        phonepeWebhookUsername: "",
        phonepeWebhookPassword: "",
        paypalClientId: "",
        paypalClientSecret: "",
        paypalWebhookId: "",
        phonepeClientVersion:
          response.data?.phonepeClientVersion || current.phonepeClientVersion,
        paypalEnvironment:
          response.data?.paypalEnvironment || current.paypalEnvironment,
      }));
      setSuccess(response.message || "Payment provider credentials saved.");
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          saveError.message ||
          "Failed to save payment provider credentials."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderCredentialInput = (field, label, placeholder, isSecret = true) => (
    <View key={field} style={styles.credentialField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.configInput}
        value={credentials[field]}
        onChangeText={(value) => updateCredential(field, value)}
        placeholder={
          configured[field] && isSecret
            ? "Configured; enter a new value to replace"
            : placeholder
        }
        secureTextEntry={isSecret}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!saving}
        keyboardType={field.endsWith("Version") ? "number-pad" : "default"}
      />
      {configured[field] && isSecret ? (
        <Text style={styles.configuredHint}>A value is already configured.</Text>
      ) : null}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payment Gateway</Text>
          <Text style={styles.headerSubtitle}>
            Control payment options available in the mobile app
          </Text>
        </View>
        <StatusBadge status={enabled ? "Enabled" : "Disabled"} />
      </View>

      {!!error && (
        <View style={styles.messageBanner}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={20}
            color="#B91C1C"
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {!!success && (
        <View style={[styles.messageBanner, styles.successBanner]}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={20}
            color="#15803D"
          />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons
              name="credit-card-check-outline"
              size={28}
              color="#4F46E5"
            />
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Enable payment gateway</Text>
            <Text style={styles.cardDescription}>
              When enabled, the selected primary provider is used for online
              checkout. Users can also choose the configured UPI QR code. When
              disabled, Make Payment opens the QR-only screen.
            </Text>
          </View>
          {loading || saving ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <Switch
              value={enabled}
              onValueChange={updateEnabled}
              disabled={loading || saving}
              accessibilityLabel="Enable payment gateway"
            />
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="cellphone"
            size={20}
            color="#64748B"
          />
          <Text style={styles.infoText}>
            Provider credentials are encrypted and write-only. Enable the
            providers you want to offer and choose one enabled provider as
            primary.             Razorpay payment links and signed webhook confirmation are active
            when Razorpay is selected as primary. Other provider integrations
            are not active yet.
          </Text>
        </View>
      </View>

      <View style={styles.providerCard}>
        <View style={styles.providerHeader}>
          <View style={[styles.providerIcon, styles.razorpayIcon]}>
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={23}
              color="#2563EB"
            />
          </View>
          <View style={styles.providerHeaderCopy}>
            <Text style={styles.providerTitle}>Razorpay</Text>
            <Text style={styles.providerSubtitle}>
              API credentials and webhook verification
            </Text>
          </View>
          <StatusBadge
            status={
              configured.razorpayKeyId &&
              configured.razorpayKeySecret &&
              configured.razorpayWebhookSecret
                ? "Configured"
                : "Incomplete"
            }
          />
        </View>
        {renderProviderSettings("razorpay", "Razorpay")}
        <View style={styles.fields}>
          {renderCredentialInput(
            "razorpayKeyId",
            "Razorpay Key ID",
            "Enter Razorpay Key ID"
          )}
          {renderCredentialInput(
            "razorpayKeySecret",
            "Razorpay Key Secret",
            "Enter Razorpay Key Secret"
          )}
          {renderCredentialInput(
            "razorpayWebhookSecret",
            "Razorpay Webhook Secret",
            "Enter Razorpay Webhook Secret"
          )}
        </View>
      </View>

      <View style={styles.providerCard}>
        <View style={styles.providerHeader}>
          <View style={[styles.providerIcon, styles.phonepeIcon]}>
            <MaterialCommunityIcons
              name="cellphone-key"
              size={23}
              color="#6D28D9"
            />
          </View>
          <View style={styles.providerHeaderCopy}>
            <Text style={styles.providerTitle}>PhonePe</Text>
            <Text style={styles.providerSubtitle}>
              Client credentials and webhook verification
            </Text>
          </View>
          <StatusBadge
            status={
              configured.phonepeClientId &&
              configured.phonepeClientSecret &&
              configured.phonepeWebhookUsername &&
              configured.phonepeWebhookPassword
                ? "Configured"
                : "Incomplete"
            }
          />
        </View>
        {renderProviderSettings("phonepe", "PhonePe")}
        <View style={styles.fields}>
          {renderCredentialInput(
            "phonepeClientId",
            "PhonePe Client ID",
            "Enter PhonePe Client ID"
          )}
          {renderCredentialInput(
            "phonepeClientSecret",
            "PhonePe Client Secret",
            "Enter PhonePe Client Secret"
          )}
          {renderCredentialInput(
            "phonepeClientVersion",
            "PhonePe Client Version",
            "1",
            false
          )}
          {renderCredentialInput(
            "phonepeWebhookUsername",
            "PhonePe Webhook Username",
            "Enter webhook username"
          )}
          {renderCredentialInput(
            "phonepeWebhookPassword",
            "PhonePe Webhook Password",
            "Enter webhook password"
          )}
        </View>
      </View>

      <View style={styles.providerCard}>
        <View style={styles.providerHeader}>
          <View style={[styles.providerIcon, styles.paypalIcon]}>
            <MaterialCommunityIcons
              name="paypal"
              size={23}
              color="#003087"
            />
          </View>
          <View style={styles.providerHeaderCopy}>
            <Text style={styles.providerTitle}>PayPal</Text>
            <Text style={styles.providerSubtitle}>
              API credentials and webhook verification
            </Text>
          </View>
          <StatusBadge
            status={
              configured.paypalClientId &&
              configured.paypalClientSecret &&
              configured.paypalWebhookId
                ? "Configured"
                : "Incomplete"
            }
          />
        </View>
        {renderProviderSettings("paypal", "PayPal")}
        <View style={styles.fields}>
          <Text style={styles.inputLabel}>PayPal environment</Text>
          <View style={styles.environmentOptions}>
            {["sandbox", "live"].map((environment) => {
              const isSelected =
                credentials.paypalEnvironment === environment;
              return (
                <TouchableOpacity
                  key={environment}
                  style={[
                    styles.environmentOption,
                    isSelected && styles.environmentOptionSelected,
                  ]}
                  onPress={() =>
                    updateCredential("paypalEnvironment", environment)
                  }
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.environmentOptionText,
                      isSelected && styles.environmentOptionTextSelected,
                    ]}
                  >
                    {environment === "sandbox" ? "Sandbox" : "Live"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderCredentialInput(
            "paypalClientId",
            "PayPal Client ID",
            "Enter PayPal Client ID"
          )}
          {renderCredentialInput(
            "paypalClientSecret",
            "PayPal Client Secret",
            "Enter PayPal Client Secret"
          )}
          {renderCredentialInput(
            "paypalWebhookId",
            "PayPal Webhook ID",
            "Enter PayPal Webhook ID"
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveCredentials}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="content-save"
              size={19}
              color="#FFFFFF"
            />
            <Text style={styles.saveButtonText}>Save Payment Settings</Text>
          </>
        )}
      </TouchableOpacity>
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
    gap: 18,
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
    marginTop: 3,
  },
  card: {
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  cardDescription: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    marginVertical: 18,
    backgroundColor: "#E2E8F0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  infoText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
  messageBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 9,
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    flex: 1,
    color: "#B91C1C",
    fontSize: 13,
  },
  successBanner: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  successText: {
    flex: 1,
    color: "#15803D",
    fontSize: 13,
  },
  providerCard: {
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  providerIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  razorpayIcon: {
    backgroundColor: "#EFF6FF",
  },
  phonepeIcon: {
    backgroundColor: "#F5F3FF",
  },
  paypalIcon: {
    backgroundColor: "#EFF6FF",
  },
  providerHeaderCopy: {
    flex: 1,
  },
  providerTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "700",
  },
  providerSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
  },
  providerSettings: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 14,
  },
  providerEnableControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minWidth: 180,
  },
  primaryButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  primaryButtonSelected: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  primaryButtonTextSelected: {
    color: "#4338CA",
  },
  fields: {
    gap: 14,
    paddingTop: 16,
  },
  credentialField: {
    gap: 6,
  },
  inputLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  configInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 14,
  },
  configuredHint: {
    color: "#15803D",
    fontSize: 11,
  },
  environmentOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  environmentOption: {
    minWidth: 96,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  environmentOptionSelected: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  environmentOptionText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  environmentOptionTextSelected: {
    color: "#4338CA",
  },
  saveButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default PaymentScreen;
