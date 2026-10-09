import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { saveToken, saveUser } from "../../../utils/auth";
import {
  createLoginPassword,
  resendLoginOtp,
  verifyLoginOtp,
} from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";
import { validatePassword, validateRequired } from "../../../utils/validation";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function UserLoginOtpScreen({ navigation, route }) {
  const { colors, isDark } = useAppTheme();
  const { email } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [passwordSetupToken, setPasswordSetupToken] = useState("");
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef([]);
  const { showSuccess, showError } = useToast();

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const updatedOtp = [...otp];
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      digits.forEach((digit, offset) => {
        if (index + offset < 6) updatedOtp[index + offset] = digit;
      });
      setOtp(updatedOtp);
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }

    updatedOtp[index] = value;
    setOtp(updatedOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      showError("Please enter the 6 digit OTP.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await verifyLoginOtp({ email, otp: enteredOtp, purpose: "LOGIN" });
      if (response.data.requiresPassword) {
        setPasswordSetupToken(response.data.passwordSetupToken);
        setPasswordModalVisible(true);
      } else {
        await finishLogin(response.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to verify login OTP.";
      setErrorMessage(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const finishLogin = async (session) => {
    await saveToken(session.token);
    await saveUser(session.user);
    setPasswordModalVisible(false);
    showSuccess("Login successful!");
    navigation.replace("Main");
  };

  const handleCreatePassword = async () => {
    const passwordError = validatePassword(password);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    const confirmPasswordError = validateRequired(confirmPassword, "confirm password");
    if (confirmPasswordError) {
      showError(confirmPasswordError);
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const response = await createLoginPassword({
        passwordSetupToken,
        password,
        confirmPassword,
      });
      await finishLogin(response.data);
    } catch (error) {
      showError(error.response?.data?.message || error.message || "Unable to create password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage("");
    setResending(true);
    try {
      await resendLoginOtp({ email });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      showSuccess("A new login OTP has been sent.");
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to resend login OTP.";
      setErrorMessage(message);
      showError(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ThemeTree>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Image
          source={isDark ? undefined : require("../../../../assets/Vector1.png")}
          style={styles.backgroundImage}
          resizeMode="stretch"
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Verify login OTP</Text>
              <View style={styles.titleUnderline} />
            </View>

            <Text style={[styles.description, { color: colors.textMuted }]}>
              Enter the 6 digit OTP sent to your registered mobile number.
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(input) => {
                    inputRefs.current[index] = input;
                  }}
                  style={[styles.otpInput, digit && styles.otpInputActive]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(event) => {
                    if (
                      event.nativeEvent.key === "Backspace" &&
                      !otp[index] &&
                      index > 0
                    ) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting || resending}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Verify and login</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: colors.textMuted }]}>
                Didn&apos;t receive the OTP?
              </Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={resending || submitting}>
                <Text style={styles.resendLink}>
                  {resending ? " Sending..." : " Resend OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Modal
          visible={passwordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={[styles.passwordModal, { backgroundColor: colors.card || "#FFFFFF" }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create password</Text>
              <Text style={[styles.modalDescription, { color: colors.textMuted }]}>
                Create a password for your account to continue.
              </Text>

              <Text style={[styles.passwordLabel, { color: colors.text }]}>Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.passwordLabel, { color: colors.text }]}>Confirm password</Text>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.submitButton, savingPassword && styles.disabledButton]}
                onPress={handleCreatePassword}
                disabled={savingPassword}
              >
                <Text style={styles.submitButtonText}>
                  {savingPassword ? "Creating..." : "Create password"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ThemeTree>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "43%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    marginTop: "80%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  titleContainer: {
    marginBottom: 18,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
  },
  titleUnderline: {
    width: 45,
    height: 2,
    backgroundColor: "#ff7f86",
    marginTop: 5,
  },
  description: {
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 25,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  otpInput: {
    width: 38,
    height: 42,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 5,
    backgroundColor: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    color: "#555555",
  },
  otpInputActive: {
    borderColor: "#ff7f86",
  },
  submitButton: {
    height: 40,
    backgroundColor: "#ff7f86",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  disabledButton: {
    opacity: 0.65,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  passwordModal: {
    borderRadius: 14,
    padding: 22,
    elevation: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 18,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  passwordInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  resendText: {
    fontSize: 10,
  },
  resendLink: {
    fontSize: 10,
    color: "#ff6f78",
    fontWeight: "500",
  },
});
