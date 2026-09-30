import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { getDashboardStatsApi } from "../api/admin.api";

const AdminDashboardScreen = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getDashboardStatsApi();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.bannerTitle}>Executive Overview</Text>
          <Text style={styles.bannerSubtitle}>
            Real-time platform metrics, customer approvals, and events
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboard}>
          <MaterialCommunityIcons name="refresh" size={18} color="#4F46E5" />
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Primary Statistics Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Customers"
          value={stats?.totalUsers || 0}
          icon="account-group"
          color="#4F46E5"
          subtitle="Registered accounts"
        />
        <StatCard
          title="Pending Accounts"
          value={stats?.pendingAccounts || 0}
          icon="account-clock"
          color="#F59E0B"
          subtitle="Awaiting approval"
        />
        <StatCard
          title="Active Customers"
          value={stats?.approvedAccounts || 0}
          icon="account-check"
          color="#10B981"
          subtitle="Approved and verified"
        />
        <StatCard
          title="Total Events"
          value={stats?.totalEvents || 0}
          icon="calendar-heart"
          color="#06B6D4"
          subtitle="Invitations created"
        />
      </View>

      {/* Quick Action Cards */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={[styles.actionCard, { borderLeftColor: "#F59E0B" }]}
          onPress={() => onNavigate("customer")}
          activeOpacity={0.7}
        >
          <View style={styles.actionIconWrapper}>
            <MaterialCommunityIcons name="account-check-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>Review Customer Approvals</Text>
            <Text style={styles.actionSubtitle}>
              {stats?.pendingAccounts || 0} customer accounts awaiting admin verification
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { borderLeftColor: "#06B6D4" }]}
          onPress={() => onNavigate("events")}
          activeOpacity={0.7}
        >
          <View style={styles.actionIconWrapper}>
            <MaterialCommunityIcons name="calendar-multiple" size={24} color="#06B6D4" />
          </View>
          <View style={styles.actionMeta}>
            <Text style={styles.actionTitle}>View Platform Events</Text>
            <Text style={styles.actionSubtitle}>
              {stats?.totalEvents || 0} active wedding, birthday, and ceremony invitations
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Recent Activity Sections */}
      <View style={styles.recentSectionGrid}>
        {/* Recent Customers */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Recent Customer Sign-Ups</Text>
            <TouchableOpacity onPress={() => onNavigate("customer")}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {stats?.recentUsers?.length ? (
            stats.recentUsers.map((user) => (
              <View key={user._id} style={styles.recentRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
                <View style={styles.recentMeta}>
                  <Text style={styles.recentTitle}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.recentSubtitle}>{user.email || user.phone}</Text>
                </View>
                <StatusBadge status={user.status} />
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent registrations</Text>
          )}
        </View>

        {/* Recent Events */}
        <View style={styles.tableCard}>
          <View style={styles.tableCardHeader}>
            <Text style={styles.tableCardTitle}>Recent Events</Text>
            <TouchableOpacity onPress={() => onNavigate("events")}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {stats?.recentEvents?.length ? (
            stats.recentEvents.map((event) => (
              <View key={event._id} style={styles.recentRow}>
                <View style={[styles.userAvatar, { backgroundColor: "#E0F2FE" }]}>
                  <Text style={[styles.userAvatarText, { color: "#0284C7" }]}>
                    {event.eventTypeId?.icon || "🎉"}
                  </Text>
                </View>
                <View style={styles.recentMeta}>
                  <Text style={styles.recentTitle}>{event.title}</Text>
                  <Text style={styles.recentSubtitle}>
                    Host: {event.hostOne} {event.hostTwo ? `& ${event.hostTwo}` : ""}
                  </Text>
                </View>
                <StatusBadge status={event.status} />
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No recent events</Text>
          )}
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
    gap: 24,
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
  banner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 5,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  actionMeta: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  recentSectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  tableCard: {
    flex: 1,
    minWidth: 320,
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
  tableCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 12,
  },
  tableCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
    gap: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "700",
  },
  recentMeta: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  recentSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  noDataText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});

export default AdminDashboardScreen;
