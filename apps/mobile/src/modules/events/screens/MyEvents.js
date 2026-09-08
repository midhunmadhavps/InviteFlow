import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MyEventsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.subtitle}>
        Your created events will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#263957",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
});
