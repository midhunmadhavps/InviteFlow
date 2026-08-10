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
import { loginUser } from "../api/auth.api";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        console.log("Please enter username and password");
        return;
      }
      const data = await loginUser(email, password);
      console.log("Login successful:", data);
    } catch (error) {
      console.log(
        "Login error:",
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
        {/* Login content */}
        <View style={styles.loginContainer}>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign in</Text>

            <View style={styles.titleUnderline} />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>

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

          {/* Password */}
          <View style={styles.passwordContainer}>
            <Text style={styles.label}>Password</Text>

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
                <Text style={styles.eyeIcon}>
                  {showPassword ? "◉" : "◌"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember + Forgot Password */}
          <View style={styles.optionsContainer}>

            <TouchableOpacity
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxSelected,
                ]}
              >
                {rememberMe && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              <Text style={styles.rememberText}>
                Remember Me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

          </View>

          {/* Login button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </TouchableOpacity>

          {/* Register */}
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

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 6,
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