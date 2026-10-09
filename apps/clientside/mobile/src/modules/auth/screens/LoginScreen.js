import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { Ionicons } from "@expo/vector-icons";
import { saveToken, saveUser } from "../../../utils/auth";
import { getRegistrationSettings, loginUser, sendLoginOtp } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";
import { validateEmail, validateRequired } from "../../../utils/validation";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const brandColor = "#ff7f86";
  const selectorBackground = isDark ? "#3A252B" : "#FFE8E9";
  const inputBorderColor = isDark ? "#604047" : "#F2C7CA";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password");
  const [submitting, setSubmitting] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);

  const { showSuccess, showError } = useToast();

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

  const handleLogin = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      showError(emailError);
      return;
    }

    if (loginMethod === "password") {
      const passwordError = validateRequired(password, "password");
      if (passwordError) {
        showError(passwordError);
        return;
      }
    }

    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (loginMethod === "password") {
        const response = await loginUser(normalizedEmail, password);
        await saveToken(response.data.token);
        await saveUser(response.data.user);
        showSuccess("Login successful.");
        navigation.replace("Main");
      } else {
        const response = await sendLoginOtp({ email: normalizedEmail });
        if (!response.success || !response.data?.sent) {
          throw new Error("Login code could not be sent. Please try again.");
        }
        showSuccess("Login code sent to your registered phone.");
        navigation.navigate("VerifyOtp", {
          email: normalizedEmail,
          purpose: "LOGIN",
        });
      }
    } catch (error) {
      showError(
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Unable to connect. Check your internet connection and try again."
          : error.message) ||
        (loginMethod === "password" ? "Unable to log in." : "Unable to send login code.")
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>

            <View style={[styles.titleUnderline, { backgroundColor: brandColor }]} />
          </View>

          <View
            style={[
              styles.methodSelector,
              { backgroundColor: selectorBackground },
            ]}
          >
            {[
              { key: "password", label: "Login with Password", accessibilityLabel: "Login with Password" },
              { key: "otp", label: "Login with OTP", accessibilityLabel: "Login with OTP" },
            ].map((method) => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.methodOption,
                  loginMethod === method.key && [
                    styles.methodOptionSelected,
                    { backgroundColor: brandColor },
                  ],
                ]}
                onPress={() => {
                  setLoginMethod(method.key);
                }}
                accessibilityRole="button"
                accessibilityLabel={method.accessibilityLabel}
                accessibilityState={{ selected: loginMethod === method.key }}
              >
                <Text
                  style={[
                    styles.methodOptionText,
                    { color: brandColor },
                    loginMethod === method.key && styles.methodOptionTextSelected,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
              Email address
            </Text>

            <View
              style={[
                styles.inputWrapper,
                { borderColor: inputBorderColor, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={15}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="demo@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email address"
              />
            </View>
          </View>

          {loginMethod === "password" && (
            <View style={styles.passwordContainer}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: inputBorderColor, backgroundColor: colors.surface },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={15}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={16}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loginMethod === "password" && (
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                accessibilityRole="button"
              >
                <Text style={[styles.forgotText, { color: brandColor }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: brandColor }]}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>
                {loginMethod === "password" ? "Login" : "Continue"}
              </Text>
            )}
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
    marginBottom: 12,
  },

  passwordContainer: {
    marginBottom: 0,
  },
  methodSelector: {
    flexDirection: "row",
    borderRadius: 11,
    overflow: "hidden",
    padding: 3,
    marginBottom: 15,
  },
  methodOption: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  methodOptionSelected: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  methodOptionText: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  methodOptionTextSelected: {
    color: "#ffffff",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    minHeight: 18,
    marginTop: 7,
  },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 5,
  },

  inputWrapper: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  inputIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: 40,
    paddingVertical: 0,
    fontSize: 12,
  },

  eyeButton: {
    width: 28,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "500",
  },

  /*
   * Login button
   */
  loginButton: {
    height: 44,
    backgroundColor: "#ff7f86",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
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