import React, { useRef, useState } from "react";
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
import { verifyOtp, resendOtp } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";

export default function OtpScreen({ navigation, route }) {
  const { phone } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const inputRefs = useRef([]);

  const { showSuccess, showError } = useToast();

  const handleOtpChange = (value, index) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];

    // Handle paste / multiple digits
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");

      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });

      setOtp(newOtp);

      const nextIndex = Math.min(index + digits.length, 5);

      inputRefs.current[nextIndex]?.focus();

      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event, index) => {
    // Move to previous input when deleting
    if (
      event.nativeEvent.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    try {
      const enteredOtp = otp.join("");

      if (enteredOtp.length !== 6) {
        showError("Please enter the 6 digit OTP");
        return;
      }

      // console.log("OTP:", enteredOtp);
      // console.log("Phone:", phone);

      const response = await verifyOtp({
        phone: phone,
        otp: enteredOtp,
      });

      // console.log("verifyOtp response:", response);

      navigation.navigate("SetPassword", {
        userId: response.data.userId,
        purpose: response.data.purpose,
      });

      // console.log("navigated to setpassword screen");

    } catch (error) {
      console.log(
        "Verify OTP error:",
        error.response?.data?.message || error.message
      );
      showError(error.response?.data?.message+" Something went wrong. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    try {
      console.log("Resend OTP");

      const response = await resendOtp({
        phone: phone,
      });

      console.log("resendOtp response:", response);
    } catch (error) {
      console.log(
        "Resend OTP error:",
        error.response?.data?.message || error.message
      );
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
        <View style={styles.otpContainer}>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Verify OTP</Text>

            <View style={styles.titleUnderline} />
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Enter the 6 digit OTP sent to your
            {"\n"}
            registered mobile number.
          </Text>

          {/* OTP inputs */}
          <View style={styles.otpContainerRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputActive,
                ]}
                value={digit}
                onChangeText={(value) =>
                  handleOtpChange(value, index)
                }
                onKeyPress={(event) =>
                  handleKeyPress(event, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              Submit
            </Text>
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't receive the OTP?
            </Text>

            <TouchableOpacity onPress={handleResendOtp}>
              <Text style={styles.resendLink}>
                {" "}Resend OTP
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

  // Pink patterned background
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

  // OTP form
  otpContainer: {
    flex: 1,
    marginTop: "80%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Title
  titleContainer: {
    marginBottom: 18,
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#3d3d3d",
  },

  titleUnderline: {
    width: 45,
    height: 2,
    backgroundColor: "#ff7f86",
    marginTop: 5,
  },

  // Description
  description: {
    fontSize: 10,
    lineHeight: 16,
    color: "#999999",
    marginBottom: 25,
  },

  // OTP boxes
  otpContainerRow: {
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

  // Submit button
  submitButton: {
    height: 35,
    backgroundColor: "#ff7f86",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 45,
  },

  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Resend
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  resendText: {
    fontSize: 9,
    color: "#999999",
  },

  resendLink: {
    fontSize: 10,
    color: "#ff6f78",
    fontWeight: "500",
  },
});