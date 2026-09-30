import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StatusBadge from "../components/StatusBadge";
import { getFirebaseDetailsApi } from "../api/admin.api";

const FirebaseDetailsScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFirebaseDetailsApi();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load authentication infrastructure details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Loading authentication configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Firebase & Authentication Security</Text>
          <Text style={styles.headerSubtitle}>
            Application auth providers, JWT session policies, and secret isolation status
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <MaterialCommunityIcons name="refresh" size={18} color="#F59E0B" />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Project Overview Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.fbIconWrapper}>
              <MaterialCommunityIcons name="firebase" size={26} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Identity & Session Management</Text>
              <Text style={styles.cardSubtitle}>Firebase Auth & JWT Gateway</Text>
            </View>
          </View>
          <StatusBadge status="Operational" />
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Project ID</Text>
            <Text style={styles.metaValue}>{data?.projectId || "inviteflow-prod-auth"}</Text>
            <Text style={styles.metaSub}>Default Google Cloud App</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>JWT Expiration Policy</Text>
            <Text style={styles.metaValue}>{data?.jwtConfiguration?.expiresIn || "7d"}</Text>
            <Text style={styles.metaSub}>Algorithm: {data?.jwtConfiguration?.algorithm || "HS256"}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Private Key / Secret Isolation</Text>
            <Text style={[styles.metaValue, { color: "#16A34A" }]}>🔒 Protected in Environment</Text>
            <Text style={styles.metaSub}>Zero secret exposure on client</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Managed Accounts</Text>
            <Text style={styles.metaValue}>{data?.statistics?.totalUsers || 0} Registered</Text>
            <Text style={styles.metaSub}>{data?.statistics?.activeUsers || 0} Active Customers</Text>
          </View>
        </View>
      </View>

      {/* Enabled Providers */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Authentication Providers</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Supported credential providers for user onboarding and verification
        </Text>

        <View style={styles.providerList}>
          {data?.authProviders?.map((prov, index) => (
            <View key={index} style={styles.providerRow}>
              <View style={styles.providerLeft}>
                <MaterialCommunityIcons name="shield-account-variant-outline" size={20} color="#4F46E5" />
                <Text style={styles.providerName}>{prov.name}</Text>
                {prov.default && (
                  <View style={styles.defaultPill}>
                    <Text style={styles.defaultPillText}>Primary</Text>
                  </View>
                )}
              </View>
              <StatusBadge status={prov.status} />
            </View>
          ))}
        </View>
      </View>

      {/* Security Policies */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security & Access Enforcement</Text>
        <Text style={[styles.cardSubtitle, { marginBottom: 16 }]}>
          Cryptographic parameters and protection mechanisms
        </Text>

        <View style={styles.policyGrid}>
          <View style={styles.policyItem}>
            <MaterialCommunityIcons name="timer-sand" size={20} color="#6366F1" />
            <Text style={styles.policyLabel}>Admin OTP Lifespan</Text>
            <Text style={styles.policyValue}>5 Minutes (Single-Use Only)</Text>
          </View>

          <View style={styles.policyItem}>
            <MaterialCommunityIcons name="lock-check" size={20} color="#6366F1" />
            <Text style={styles.policyLabel}>Password Encryption</Text>
            <Text style={styles.policyValue}>bcrypt (10 Salt Rounds)</Text>
          </View>

          <View style={styles.policyItem}>
            <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#6366F1" />
            <Text style={styles.policyLabel}>Rate Limiting</Text>
            <Text style={styles.policyValue}>5 Requests / 10 Min Window</Text>
          </View>

          <View style={styles.policyItem}>
            <MaterialCommunityIcons name="account-cancel-outline" size={20} color="#6366F1" />
            <Text style={styles.policyLabel}>Customer Admin Denial</Text>
            <Text style={styles.policyValue}>Backend Middleware 403 Forbidden</Text>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
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
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B45309",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fbIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metaItem: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  metaSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  providerList: {
    gap: 10,
  },
  providerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  providerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  providerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  defaultPill: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6D28D9",
  },
  policyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  policyItem: {
    flex: 1,
    minWidth: 220,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  policyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  policyValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
});

export default FirebaseDetailsScreen;
