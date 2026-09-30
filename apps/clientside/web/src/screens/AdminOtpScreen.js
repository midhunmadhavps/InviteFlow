import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminOtpScreen = ({ email, onBackToLogin }) => {
  const { verifyOtp, requestOtp } = useAdminAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (!otp.trim() || otp.trim().length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await verifyOtp(email, otp.trim());
      // On success, context updates and automatically transitions to Dashboard
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    setResendSuccess(false);

    try {
      await requestOtp(email);
      setResendSuccess(true);
      setResendCooldown(60);
      setOtp("");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={onBackToLogin}
          style={styles.backBtn}
          disabled={loading}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#64748B" />
          <Text style={styles.backBtnText}>Back to Email</Text>
        </TouchableOpacity>

        {/* Icon & Title */}
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="cellphone-key" size={32} color="#4F46E5" />
        </View>
        <Text style={styles.title}>Two-Factor Verification</Text>
        
        {/* Required Message */}
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#4F46E5" />
          <Text style={styles.infoText}>
            OTP sent to your registered mobile number
          </Text>
        </View>

        <Text style={styles.emailSubtext}>
          Logging in as: <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {/* Alerts */}
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {resendSuccess ? (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
            <Text style={styles.successText}>A fresh OTP has been sent.</Text>
          </View>
        ) : null}

        {/* OTP Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>6-Digit Security Code</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="• • • • • •"
            placeholderTextColor="#94A3B8"
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/[^0-9]/g, "").slice(0, 6));
              if (error) setError("");
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            editable={!loading}
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.submitBtn, (loading || otp.length < 6) && styles.submitBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Verify & Enter Admin</Text>
              <MaterialCommunityIcons name="check-bold" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Resend Action */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0 || resending || loading}
          >
            <Text
              style={[
                styles.resendLink,
                (resendCooldown > 0 || resending) && styles.resendLinkDisabled,
              ]}
            >
              {resending
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: "100vh",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 36,
    width: "100%",
    maxWidth: 440,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
    marginBottom: 8,
    gap: 10,
  },
  infoText: {
    color: "#3730A3",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  emailSubtext: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  emailHighlight: {
    fontWeight: "600",
    color: "#1E293B",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  successText: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    textAlign: "center",
  },
  otpInput: {
    borderWidth: 2,
    borderColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: 8,
    backgroundColor: "#F8FAFC",
    outlineStyle: "none",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 6,
  },
  resendPrompt: {
    fontSize: 13,
    color: "#64748B",
  },
  resendLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
  resendLinkDisabled: {
    color: "#94A3B8",
  },
});

export default AdminOtpScreen;
