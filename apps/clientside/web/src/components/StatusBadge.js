import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StatusBadge = ({ status }) => {
  const getBadgeStyle = () => {
    switch (String(status).toLowerCase()) {
      case "active":
      case "approved":
      case "published":
      case "connected":
      case "operational":
      case "enabled":
        return { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" };
      case "pending":
      case "draft":
      case "needs attention":
      case "configured":
        return { bg: "#FEF3C7", text: "#B45309", border: "#FCD34D" };
      case "blocked":
      case "rejected":
      case "cancelled":
      case "not configured":
      case "missing":
        return { bg: "#FEE2E2", text: "#B91C1C", border: "#FCA5A5" };
      case "admin":
        return { bg: "#EDE9FE", text: "#6D28D9", border: "#C4B5FD" };
      case "customer":
        return { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" };
      default:
        return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
    }
  };

  const colors = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status || "Unknown"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

export default StatusBadge;
