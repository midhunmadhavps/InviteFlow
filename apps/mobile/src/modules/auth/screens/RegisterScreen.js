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
import { registerUser } from "../api/auth.api";
import { useToast } from "../../../context/ToastContext";
import { validateName, validateEmail, validatePhone, } from "../../../utils/validation";
import { RequiredLabel, Label } from "../../../components/RequiredLabel";

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const { showSuccess, showError } = useToast();

  const handleRegister = async () => {
    try {
      
      let errorMessage;
      errorMessage = validateName(firstName, "first name");
      if (errorMessage) {
        showError(errorMessage);
        return;
      }

      errorMessage = validateName(lastName, "last name");
      if (errorMessage) {
        showError(errorMessage);
        return;
      }

      errorMessage = validateEmail(email);
      if (errorMessage) {
        showError(errorMessage);
        return;
      }

      errorMessage = validatePhone(phone);
      if (errorMessage) {
        showError(errorMessage);
        return;
      }

      const response = await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      // console.log("Register response:", response);

      // Registration successful
      navigation.navigate("VerifyOtp", {
        phone: response.data.phone,
      });

    } catch (error) {
      console.log(
        "Registration error:",
        error.response?.data?.message || error.message
      );
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

          {/* First Name */}
          <View style={styles.inputContainer}>
            <RequiredLabel>First Name</RequiredLabel>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>◯</Text>

              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                placeholderTextColor="#bdbdbd"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <Label>Last Name</Label>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>◯</Text>

              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                placeholderTextColor="#bdbdbd"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
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

          {/* Phone */}
          <View style={styles.inputContainer}>
            <RequiredLabel>Phone number</RequiredLabel>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>▯</Text>

              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+00 000-0000-000"
                placeholderTextColor="#bdbdbd"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleRegister}
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
    marginTop: "80%",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Title
  titleContainer: {
    marginBottom: 22,
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

  // Inputs
  inputContainer: {
    marginBottom: 13,
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

  // Create account button
  createButton: {
    height: 34,
    backgroundColor: "#ff7f86",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 43,
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 13,
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
    fontSize: 10,
    color: "#999999",
  },

  loginLink: {
    fontSize: 10,
    color: "#ff6f78",
    fontWeight: "500",
  },
});