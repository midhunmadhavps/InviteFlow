import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminHeader = ({ title, onMenuToggle, isMobile }) => {
  const { admin, logout } = useAdminAuth();

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        {isMobile && (
          <TouchableOpacity onPress={onMenuToggle} style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={24} color="#334155" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightContainer}>
        <View style={styles.adminInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {admin?.firstName ? admin.firstName.charAt(0).toUpperCase() : "A"}
            </Text>
          </View>
          <View style={styles.adminMeta}>
            <Text style={styles.adminName}>
              {admin ? `${admin.firstName || ""} ${admin.lastName || ""}`.trim() : "Administrator"}
            </Text>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>ADMIN</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout-variant" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  adminInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  adminMeta: {
    display: "flex",
  },
  adminName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  roleTag: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6D28D9",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default AdminHeader;
