import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "../modules/auth/screens/WelcomeScreen";
import LoginScreen from "../modules/auth/screens/LoginScreen";
import RegisterScreen from "../modules/auth/screens/RegisterScreen";
import ResetPasswordScreen from "../modules/auth/screens/ResetPasswordScreen";
import ForgotPasswordScreen from "../modules/auth/screens/ForgotPasswordScreen";
import SetPasswordScreen from "../modules/auth/screens/SetPasswordScreen";
import VerifyOtpScreen from "../modules/auth/screens/VerifyOtpScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen}/>
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}