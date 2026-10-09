import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
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
import { resendLoginOtp, verifyLoginOtp } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function UserLoginOtpScreen({ navigation, route }) {
  const { colors, isDark } = useAppTheme();
  const { email, phone } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
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
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      showError("Please enter the 6 digit OTP.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await verifyLoginOtp({ email, phone, otp: enteredOtp });
      await saveToken(response.data.token);
      await saveUser(response.data.user);
      showSuccess("Login successful!");
      navigation.replace("Main");
    } catch (error) {
      showError(error.response?.data?.message || error.message || "Unable to verify login OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await resendLoginOtp({ email, phone });
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      showSuccess("A new login OTP has been sent.");
    } catch (error) {
      showError(error.response?.data?.message || error.message || "Unable to resend login OTP.");
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
              Enter the 6 digit OTP sent to your mobile number ending in {phone.slice(-4)}.
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

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting || resending}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Verifying..." : "Verify and login"}
              </Text>
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
