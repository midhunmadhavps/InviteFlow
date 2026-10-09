import React, { useEffect, useState } from "react";
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
import { getRegistrationSettings, requestLoginOtp } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";
import { validateEmail, validatePhone } from "../../../utils/validation";
import { RequiredLabel } from "../../../components/RequiredLabel";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // const [password, setPassword] = useState("");
  // const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);

  const { showError } = useToast();

  useEffect(() => {
    let isActive = true;

    getRegistrationSettings()
      .then((response) => {
        if (isActive) {
          setRegistrationEnabled(response.data?.allowRegistration === true);
        }
      })
      .catch((error) => {
        showError(
          error.response?.data?.message ||
            "Unable to check registration availability. Sign-up is hidden until the connection is restored."
        );
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleRequestLoginOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      showError(emailError);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      showError(phoneError);
      return;
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = phone.trim();
      await requestLoginOtp({ email: normalizedEmail, phone: normalizedPhone });
      navigation.navigate("UserLoginOtp", {
        email: normalizedEmail,
        phone: normalizedPhone,
      });
    } catch (error) {
      showError(error.response?.data?.message || error.message || "Unable to send login OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  // Future password login:
  // const handleLogin = async () => {
  //   try {
  //     const emailError = validateEmail(email);
  //     if (emailError) return showError(emailError);
  //     const passwordError = validateRequired(password, "Password");
  //     if (passwordError) return showError(passwordError);
  //     const response = await loginUser(email.trim(), password);
  //     if (response.success) {
  //       await saveToken(response.data.token);
  //       await saveUser(response.data.user);
  //       navigation.replace("Main");
  //     }
  //   } catch (error) {
  //     showError(error.response?.data?.message || error.message || "Unable to log in.");
  //   }
  // };
  // Future password flow imports:
  // import { saveToken, saveUser } from "../../../utils/auth";
  // import { loginUser } from "../api/auth.api";
  // import { validateRequired } from "../../../utils/validation";

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ThemeTree>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Pink patterned background */}
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
        {/* Login content */}
        <View style={styles.loginContainer}>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign in</Text>

            <View style={styles.titleUnderline} />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <RequiredLabel>Email</RequiredLabel>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="demo@email.com"
                placeholderTextColor="#bdbdbd"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Mobile number */}
          <View style={styles.inputContainer}>
            <RequiredLabel>Mobile number</RequiredLabel>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>▯</Text>

              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your mobile number"
                placeholderTextColor="#bdbdbd"
                keyboardType="phone-pad"
                maxLength={10}
                autoCorrect={false}
              />
            </View>
          </View>

          {/*
          Future password login UI:
          <View style={styles.passwordContainer}>
            <RequiredLabel>Password</RequiredLabel>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>◉</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#bdbdbd"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "◉" : "◌"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
          */}

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleRequestLoginOtp}
            disabled={submitting}
          >
            <Text style={styles.loginButtonText}>
              {submitting ? "Sending OTP..." : "Continue"}
            </Text>
          </TouchableOpacity>

          {/* Register */}
          {registrationEnabled && (
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an Account?
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.signupText}>
                  {" "}Sign up
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
      </ThemeTree>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /*
   * Pink Vector image
   */
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "60%",
  },

  scrollContent: {
    flexGrow: 1,
  },

  /*
   * Login form
   */
  loginContainer: {
    flex: 1,
    marginTop: "100%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  /*
   * Sign in title
   */
  titleContainer: {
    marginBottom: 24,
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

  /*
   * Email / Password
   */
  inputContainer: {
    marginBottom: 14,
  },

  passwordContainer: {
    marginBottom: 10,
  },

  inputWrapper: {
    height: 30,
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
    height: 30,
    paddingVertical: 0,
    paddingHorizontal: 3,
    fontSize: 9,
    color: "#555555",
  },

  eyeButton: {
    width: 22,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  eyeIcon: {
    fontSize: 11,
    color: "#bdbdbd",
  },

  /*
   * Remember / Forgot
   */
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },

  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: "#ff7f86",
    borderRadius: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },

  checkboxSelected: {
    backgroundColor: "#ff7f86",
  },

  checkmark: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: "bold",
    lineHeight: 8,
  },

  rememberText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#555555",
  },

  forgotText: {
    fontSize: 10,
    color: "#ff6f78",
    fontWeight: "500",
  },

  /*
   * Login button
   */
  loginButton: {
    height: 35,
    backgroundColor: "#ff7f86",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 52,
  },

  loginButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  /*
   * Register
   */
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  registerText: {
    fontSize: 10,
    color: "#999999",
  },

  signupText: {
    fontSize: 10,
    color: "#ff6f78",
    fontWeight: "500",
  },
});