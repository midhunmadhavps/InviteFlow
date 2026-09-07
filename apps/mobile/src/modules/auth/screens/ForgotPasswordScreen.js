import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { forgotPasswordUser } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";

export default function ForgotPasswordScreen({ navigation }) {
  const [phone, setPhone] = useState("");

  const { showSuccess, showError } = useToast();

  const handleForgotPassword = async () => {
    try {
      if (!phone) {
        showError("Please enter your phone number.");
        return;
      }

      const response = await forgotPasswordUser({
        phone,
      });

      console.log("Forgot password response:", response);

      showSuccess("OTP sent successfully.");

      navigation.navigate("VerifyOtp", {
        phone: phone,
        purpose: "FORGOT_PASSWORD",
      });

    } catch (error) {
      console.log(
        "Forgot Password error:",
        error.response?.data?.message || error.message
      );
      showError(error.response?.data?.message+" Unable to send OTP. Please try again.");
      
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />

      {/* Pink patterned background */}
      <Image
        source={require("../../../../assets/Vector1.png")}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.forgotContainer}>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Forgot Password</Text>

            <View style={styles.titleUnderline} />
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Enter your phone number and we will send you an OTP to reset your
            password.
          </Text>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone no</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>▯</Text>

              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+00 000-0000-000"
                placeholderTextColor="#bdbdbd"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Send OTP */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.sendButtonText}>
              Send OTP
            </Text>
          </TouchableOpacity>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Remember your password?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLink}>
                {" "}Login
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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

  forgotContainer: {
    flex: 1,
    marginTop: "80%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  titleContainer: {
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#3d3d3d",
  },

  titleUnderline: {
    width: 45,
    height: 2,
    backgroundColor: "#ff7f86",
    marginTop: 5,
  },

  description: {
    fontSize: 11,
    lineHeight: 17,
    color: "#999999",
    marginBottom: 24,
  },

  inputContainer: {
    marginBottom: 13,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 6,
  },

  inputWrapper: {
    height: 29,
    borderBottomWidth: 1,
    borderBottomColor: "#ff7f86",
    flexDirection: "row",
    alignItems: "center",
  },

  inputIcon: {
    width: 16,
    fontSize: 10,
    color: "#bdbdbd",
    textAlign: "center",
    marginRight: 3,
  },

  input: {
    flex: 1,
    height: 29,
    paddingVertical: 0,
    paddingHorizontal: 3,
    fontSize: 10,
    color: "#555555",
  },

  sendButton: {
    height: 34,
    backgroundColor: "#ff7f86",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 43,
  },

  sendButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  loginText: {
    fontSize: 10,
    color: "#999999",
  },

  loginLink: {
    fontSize: 10,
    color: "#ff6f78",
    fontWeight: "500",
  },
});