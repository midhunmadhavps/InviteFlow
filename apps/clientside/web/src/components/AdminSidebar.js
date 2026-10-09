import React, { useEffect, useState } from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAdminAuth } from "../context/AdminAuthContext";
import { getSystemConfigApi } from "../api/admin.api";
import Modal from "./Modal";

const AdminSidebar = ({ activeTab, onSelectTab, isMobile, onCloseMobile }) => {
  const { logout } = useAdminAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [systemLogo, setSystemLogo] = useState("");
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSystemLogo = async () => {
      try {
        const response = await getSystemConfigApi();
        if (isMounted) {
          setSystemLogo(response.data?.logo || "");
          setLogoLoadFailed(false);
        }
      } catch (error) {
        console.error("Failed to load system logo:", error);
      }
    };

    loadSystemLogo();
    return () => {
      isMounted = false;
    };
  }, []);

  const getSystemLogoUrl = (logo) => {
    if (!logo) return "";
    if (/^https?:\/\//i.test(logo)) return logo;
    if (logo.startsWith("/uploads/")) return `http://localhost:3000${logo}`;
    return `http://localhost:3000/uploads/${encodeURIComponent(logo)}`;
  };

  const handleSelect = (tabKey) => {
    onSelectTab(tabKey);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "view-dashboard-outline" },
    { key: "customer", label: "Customer", icon: "account-group-outline" },
    { key: "events", label: "Events", icon: "calendar-heart" },
    { key: "payment", label: "Payment", icon: "credit-card-outline" },
    { key: "configurations", label: "Configurations", icon: "tune-vertical" },
  ];

  return (
    <View style={[styles.sidebar, isMobile && styles.sidebarMobile]}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        {systemLogo && !logoLoadFailed ? (
          <Image
            source={{ uri: getSystemLogoUrl(systemLogo) }}
            style={styles.logoImage}
            resizeMode="contain"
            onError={() => setLogoLoadFailed(true)}
            accessibilityLabel="System logo"
          />
        ) : (
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="email-seal-outline" size={22} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle}>InviteFlow</Text>
          <Text style={styles.brandSubtitle}>Admin Panel</Text>
        </View>
        {isMobile && (
          <TouchableOpacity onPress={onCloseMobile} style={styles.closeMobileBtn}>
            <MaterialCommunityIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handleSelect(item.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={22}
                color={isActive ? "#FFFFFF" : "#64748B"}
              />
              <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
        confirmText="Logout"
        confirmColor="#DC2626"
        onConfirm={async () => {
          setShowLogoutModal(false);
          await logout();
        }}
      >
        <Text style={styles.modalBodyText}>
          Are you sure you want to log out of the InviteFlow Admin Panel?
        </Text>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  sidebarMobile: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  closeMobileBtn: {
    padding: 4,
  },
  navList: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  navItemActive: {
    backgroundColor: "#4F46E5",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  navItemTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
  modalBodyText: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
  },
});

export default AdminSidebar;
