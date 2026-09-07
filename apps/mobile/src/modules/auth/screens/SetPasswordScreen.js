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
import { setPasswordUser } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";

export default function SetPasswordScreen({ navigation, route }) {
  const { userId } = route.params;
  const { purpose } = route.params;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showSuccess, showError } = useToast();

  const handleSetPassword = async () => {
    try {

      if (!userId) {
        console.log("ERROR: userId is missing");
        showError("Something went wrong please try again later.");
        return;
      }

      if (!password || !confirmPassword) {
        showError("Please fill all mandatory fields");
        return;
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match");
        return;
      }

      const payload = {
        userId,
        password,
        confirmPassword,
      };

      const response = await setPasswordUser(payload);

      if (response?.success) { 
        if(response.purpose == "FORGOT_PASSWORD"){
          showSuccess("Successfully Password updated");
        }else{
          showSuccess("Successfully Password created");
        }
        navigation.navigate("Login");
      }

    } catch (error) {
      console.log("FULL ERROR:", error);
      console.log("ERROR DATA:", error.response?.data);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong.";

      console.log("ERROR MESSAGE:", message);
      showError(error.response?.data?.message+" Something went wrong. Please try again.");
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
        <View style={styles.registerContainer}>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign up</Text>

            <View style={styles.titleUnderline} />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
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
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? "◉" : "◌"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>◉</Text>

              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#bdbdbd"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? "◉" : "◌"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={styles.createButton}
             onPress={handleSetPassword}
          >
            <Text style={styles.createButtonText}>
              Create Account
            </Text>
          </TouchableOpacity>

          {/* Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an Account?
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

  // Pink patterned image
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

  // Registration form
  registerContainer: {
    flex: 1,
    marginTop: "47%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Title
  titleContainer: {
    marginBottom: 22,
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

  // Inputs
  inputContainer: {
    marginBottom: 13,
  },

  label: {
    fontSize: 11,
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

  eyeButton: {
    width: 22,
    height: 29,
    justifyContent: "center",
    alignItems: "center",
  },

  eyeIcon: {
    fontSize: 11,
    color: "#bdbdbd",
  },

  // Create account button
  createButton: {
    height: 32,
    backgroundColor: "#ff7f86",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 43,
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Login link
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  loginText: {
    fontSize: 8,
    color: "#999999",
  },

  loginLink: {
    fontSize: 8,
    color: "#ff6f78",
    fontWeight: "500",
  },
});