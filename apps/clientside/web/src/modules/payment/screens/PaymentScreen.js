import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StatusBadge from "../../../components/StatusBadge";

const PaymentScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payment Management</Text>
          <Text style={styles.headerSubtitle}>
            Payment gateway integration, reconciliation, and transaction settlement
          </Text>
        </View>
        <StatusBadge status="Coming in Next Phase" />
      </View>

      {/* Hero Placeholder Card */}
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="credit-card-clock-outline" size={48} color="#4F46E5" />
        </View>
        <Text style={styles.heroTitle}>Payment Gateway Module</Text>
        <Text style={styles.heroSubtitle}>
          Automated payment processing, UPI reconciliation, invoice generation, and tier upgrade management are scheduled for the next phase.
        </Text>

        <View style={styles.roadmapGrid}>
          <View style={styles.roadmapItem}>
            <MaterialCommunityIcons name="bank-transfer" size={24} color="#4F46E5" />
            <Text style={styles.roadmapTitle}>UPI & Gateway Webhooks</Text>
            <Text style={styles.roadmapText}>Razorpay / Stripe auto-settlement</Text>
          </View>

          <View style={styles.roadmapItem}>
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#4F46E5" />
            <Text style={styles.roadmapTitle}>Automated Invoices</Text>
            <Text style={styles.roadmapText}>PDF billing & GST invoice delivery</Text>
          </View>

          <View style={styles.roadmapItem}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#4F46E5" />
            <Text style={styles.roadmapTitle}>Admin Refunds & Audits</Text>
            <Text style={styles.roadmapText}>Direct transaction disputes & logging</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  contentContainer: {
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 36,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 520,
    lineHeight: 22,
  },
  roadmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 32,
    width: "100%",
  },
  roadmapItem: {
    flex: 1,
    minWidth: 200,
    maxWidth: 260,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    textAlign: "center",
  },
  roadmapTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 10,
    textAlign: "center",
  },
  roadmapText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
});

export default PaymentScreen;
