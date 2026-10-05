import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function WelcomeScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeTree>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Pink patterned background */}
      <Image
        source={isDark ? undefined : require("../../../../assets/Vector1.png")}
        style={styles.backgroundImage}
        resizeMode="stretch"
      />

      {/* Content */}
      <View style={styles.content}>

        <View style={styles.welcomeSection}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>
            Lorem ipsum dolor sit amet consectetur.
            {"\n"}
            Lorem ipsum dolor sit.
            </Text>
        </View>

        <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => navigation.navigate("Login")}
        >
          <Text style={[styles.continueText, { color: colors.textMuted }]}>Continue</Text>

          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>
      </View>
      </ThemeTree>
    </View>
  );
}

const styles = StyleSheet.create({

    welcomeSection: {
        marginBottom: 50,
    },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "75%",
  },

  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 35,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#3d3d3d",
    marginBottom: 10,
  },

  description: {
    fontSize: 12,
    lineHeight: 18,
    color: "#999999",
  },

  continueButton: {
    marginTop: 30,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
  },

  continueText: {
    fontSize: 11,
    color: "#777777",
    marginRight: 8,
  },

  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff7f86",
    justifyContent: "center",
    alignItems: "center",
  },

  arrow: {
    color: "#ffffff",
    fontSize: 18,
  },
});