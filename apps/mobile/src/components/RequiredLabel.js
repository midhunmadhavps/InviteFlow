import React from "react";
import { Text, StyleSheet } from "react-native";

const RequiredLabel = ({ children }) => {
  return (
    <Text style={styles.label}>
      {children} <Text style={styles.required}>*</Text>
    </Text>
  );
};

const Label = ({ children }) => {
  return (
    <Text style={styles.label}>
      {children} <Text style={styles.required}></Text>
    </Text>
  );
};

export { RequiredLabel,Label };

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 6,
  },

  required: {
    color: "#ff4d4f",
    fontWeight: "700",
  },
});