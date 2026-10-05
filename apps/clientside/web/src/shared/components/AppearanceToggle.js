import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TRACK_WIDTH = 88;
const SEGMENT_WIDTH = 40;

const AppearanceToggle = ({ mode, onChange, accessibilityLabel = "Appearance" }) => {
  const slide = useRef(new Animated.Value(mode === "dark" ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: mode === "dark" ? 1 : 0,
      useNativeDriver: false,
      stiffness: 240,
      damping: 22,
      mass: 0.7,
    }).start();
  }, [mode, slide]);

  const activeOffset = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SEGMENT_WIDTH],
  });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        {
          backgroundColor: mode === "dark" ? "#374151" : "#E2E8F0",
          borderColor: mode === "dark" ? "#4B5563" : "#CBD5E1",
        },
      ]}
      role="radiogroup"
    >
      <Animated.View
        style={[
          styles.activeSegment,
          {
            backgroundColor: mode === "dark" ? "#1F2937" : "#FFFFFF",
            transform: [{ translateX: activeOffset }],
          },
        ]}
      />
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="Light mode"
        accessibilityState={{ selected: mode === "light" }}
        onPress={() => onChange("light")}
        style={styles.segment}
      >
        <MaterialCommunityIcons
          name="white-balance-sunny"
          size={18}
          color={mode === "light" ? "#F59E0B" : "#94A3B8"}
        />
      </Pressable>
      <Pressable
        accessibilityRole="radio"
        accessibilityLabel="Dark mode"
        accessibilityState={{ selected: mode === "dark" }}
        onPress={() => onChange("dark")}
        style={styles.segment}
      >
        <MaterialCommunityIcons
          name="moon-waning-crescent"
          size={18}
          color={mode === "dark" ? "#E0E7FF" : "#94A3B8"}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: 38,
    padding: 3,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    overflow: "hidden",
  },
  activeSegment: {
    position: "absolute",
    top: 3,
    left: 3,
    width: SEGMENT_WIDTH,
    height: 30,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.13,
    shadowRadius: 3,
    elevation: 2,
  },
  segment: {
    width: SEGMENT_WIDTH,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
});

export default AppearanceToggle;
