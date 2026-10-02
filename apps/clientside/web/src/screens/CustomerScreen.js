import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import {
  getUsersApi,
  createCustomerApi,
  approveAccountApi,
  rejectAccountApi,
  updateUserStatusApi,
} from "../api/admin.api";

const CustomerScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    action: null, // "approve" | "reject"
    user: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const handleRegisterCustomer = async () => {
    setError("");
    setSuccessMessage("");

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    if (!/^[A-Za-z\s]+$/.test(normalizedFirstName)) {
      setError("Please enter a valid first name.");
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(normalizedLastName)) {
      setError("Please enter a valid last name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setRegistrationLoading(true);
    try {
      const response = await createCustomerApi({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        phone: normalizedPhone,
      });
      await fetchUsers(1, statusFilter, search);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setIsRegistering(false);
      setSuccessMessage(response.message || "Customer registered successfully.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to register customer.");
    } finally {
      setRegistrationLoading(false);
    }
  };

  const fetchUsers = async (currentPage = 1, currentStatus = statusFilter, currentSearch = search) => {
    setLoading(true);
    setError("");
    try {
      const res = await getUsersApi({
        page: currentPage,
        role: "customer",
        status: currentStatus,
        search: currentSearch,
        limit: 10,
      });
      if (res.success && res.data) {
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, statusFilter, search);
  }, [statusFilter]);

  const handleExecuteAction = async () => {
    const { action, user } = confirmModal;
    if (!user) return;

    setActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (action === "approve") {
        const res = await approveAccountApi(user._id);
        setSuccessMessage(res.message || `Customer account for ${user.firstName} approved.`);
      } else if (action === "reject") {
        const res = await rejectAccountApi(user._id);
        setSuccessMessage(res.message || `Customer account for ${user.firstName} blocked.`);
      }
      setConfirmModal({ visible: false, action: null, user: null });
      fetchUsers(page, statusFilter, search);
    } catch (err) {
      setError(err.message || `Failed to ${action} customer account.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "Active" ? "Blocked" : "Active";
    setActionLoading(true);
    try {
      await updateUserStatusApi(user._id, newStatus);
      setSuccessMessage(`Customer status updated to ${newStatus}.`);
      fetchUsers(page, statusFilter, search);
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: "Customer Name",
      width: 200,
      renderCell: (row) => (
        <View>
          <Text style={styles.primaryText}>{`${row.firstName || ""} ${row.lastName || ""}`.trim()}</Text>
          <Text style={styles.subText}>@{row.username || "no-username"}</Text>
        </View>
      ),
    },
    {
      title: "Email",
      field: "email",
      width: 220,
      renderCell: (row) => <Text style={styles.cellText}>{row.email || "N/A"}</Text>,
    },
    {
      title: "Mobile",
      field: "phone",
      width: 140,
      renderCell: (row) => <Text style={styles.cellText}>{row.phone || "N/A"}</Text>,
    },
    {
      title: "Status",
      width: 120,
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      title: "Registration Date",
      width: 150,
      renderCell: (row) => (
        <Text style={styles.cellText}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}
        </Text>
      ),
    },
    {
      title: "Actions",
      width: 220,
      renderCell: (row) => (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => {
              setSelectedUser(row);
              setDetailsModalVisible(true);
            }}
          >
            <MaterialCommunityIcons name="eye-outline" size={16} color="#4F46E5" />
            <Text style={styles.detailBtnText}>View</Text>
          </TouchableOpacity>

          {row.status === "Pending" ? (
            <>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => setConfirmModal({ visible: true, action: "approve", user: row })}
              >
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => setConfirmModal({ visible: true, action: "reject", user: row })}
              >
                <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.statusToggleBtn, row.status === "Active" ? styles.blockBtn : styles.unblockBtn]}
              onPress={() => handleToggleStatus(row)}
            >
              <Text style={[styles.statusToggleText, row.status === "Active" ? styles.blockBtnText : styles.unblockBtnText]}>
                {row.status === "Active" ? "Block" : "Activate"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{isRegistering ? "Register Customer" : "Customer Management"}</Text>
          <Text style={styles.headerSubtitle}>
            {isRegistering
              ? "Create an active customer account with verified contact details"
              : "Manage registered customers, approve pending accounts, and review profiles"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => {
            setError("");
            setSuccessMessage("");
            setIsRegistering(!isRegistering);
          }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isRegistering ? "arrow-left" : "account-plus-outline"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.registerButtonText}>
            {isRegistering ? "Back to Customers" : "Register Customer"}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      {isRegistering ? (
        <ScrollView
          style={styles.registrationScroll}
          contentContainerStyle={styles.registrationScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.registrationCard}>
            <Image
              source={require("../../assets/Vector1.png")}
              style={styles.registrationBackground}
              resizeMode="stretch"
            />
            <View style={styles.registrationHeading}>
              <View style={styles.registrationIcon}>
                <MaterialCommunityIcons name="account-plus-outline" size={24} color="#FF7F86" />
              </View>
              <View>
                <Text style={styles.registrationTitle}>Customer details</Text>
                <Text style={styles.registrationSubtitle}>Enter the information to create an account</Text>
              </View>
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>First name</Text>
                <View style={styles.formInputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={18} color="#B8A2A3" />
                  <TextInput
                    style={styles.formInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor="#A8A8A8"
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={50}
                  />
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Last name</Text>
                <View style={styles.formInputWrapper}>
                  <MaterialCommunityIcons name="account-outline" size={18} color="#B8A2A3" />
                  <TextInput
                    style={styles.formInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor="#A8A8A8"
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={50}
                  />
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email address</Text>
                <View style={styles.formInputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={18} color="#B8A2A3" />
                  <TextInput
                    style={styles.formInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@example.com"
                    placeholderTextColor="#A8A8A8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone number</Text>
                <View style={styles.formInputWrapper}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color="#B8A2A3" />
                  <TextInput
                    style={styles.formInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="10-digit phone number"
                    placeholderTextColor="#A8A8A8"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>
            </View>

            <View style={styles.accountDefaults}>
              <MaterialCommunityIcons name="shield-check-outline" size={19} color="#15803D" />
              <View style={styles.accountDefaultsText}>
                <Text style={styles.accountDefaultsTitle}>Account will be ready to use</Text>
                <Text style={styles.accountDefaultsSubtitle}>
                  Password: Admin@123  ·  Email and phone verified  ·  Status: Active
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, registrationLoading && styles.submitButtonDisabled]}
              onPress={handleRegisterCustomer}
              disabled={registrationLoading}
              activeOpacity={0.85}
            >
              {registrationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="account-check-outline" size={19} color="#FFFFFF" />
              )}
              <Text style={styles.submitButtonText}>
                {registrationLoading ? "Registering..." : "Create Customer Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchValue={search}
        onSearchChange={(text) => {
          setSearch(text);
          fetchUsers(1, statusFilter, text);
        }}
        searchPlaceholder="Search customers by name, email, phone..."
        filters={[
          { key: "All", label: "All Customers" },
          { key: "Pending", label: "Pending Approvals" },
          { key: "Active", label: "Active" },
          { key: "Blocked", label: "Blocked" },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(filter) => setStatusFilter(filter)}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={(p) => fetchUsers(p, statusFilter, search)}
        emptyMessage="No customer records found."
      />
      )}

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        title="Customer Profile Details"
        hideActions
      >
        {selectedUser ? (
          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{selectedUser.firstName} {selectedUser.lastName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{selectedUser.email || "Not provided"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <Text style={styles.detailValue}>{selectedUser.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue}>@{selectedUser.username || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Status</Text>
              <StatusBadge status={selectedUser.status} />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Verified</Text>
              <Text style={styles.detailValue}>{selectedUser.isPhoneVerified ? "✅ Yes" : "❌ No"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email Verified</Text>
              <Text style={styles.detailValue}>{selectedUser.isEmailVerified ? "✅ Yes" : "❌ No"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Registration Date</Text>
              <Text style={styles.detailValue}>
                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "-"}
              </Text>
            </View>
          </View>
        ) : null}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, action: null, user: null })}
        title={confirmModal.action === "approve" ? "Approve Customer Account" : "Reject / Block Account"}
        confirmText={confirmModal.action === "approve" ? "Yes, Approve" : "Yes, Block"}
        confirmColor={confirmModal.action === "approve" ? "#16A34A" : "#DC2626"}
        isConfirming={actionLoading}
        onConfirm={handleExecuteAction}
      >
        <Text style={styles.confirmModalText}>
          Are you sure you want to {confirmModal.action} the customer account for:
        </Text>
        <Text style={styles.confirmTargetName}>
          {confirmModal.user?.firstName} {confirmModal.user?.lastName} ({confirmModal.user?.email || confirmModal.user?.phone})
        </Text>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    gap: 20,
    minHeight: 0,
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
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: "#FF7F86",
    shadowColor: "#FF7F86",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  registrationScroll: {
    flex: 1,
  },
  registrationScrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  registrationCard: {
    width: "100%",
    maxWidth: 760,
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5D9DA",
    backgroundColor: "#FFFFFF",
    shadowColor: "#5B1C21",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  registrationBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 150,
  },
  registrationHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 26,
  },
  registrationIcon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FFF0F1",
  },
  registrationTitle: {
    color: "#3D3D3D",
    fontSize: 20,
    fontWeight: "800",
  },
  registrationSubtitle: {
    color: "#777777",
    fontSize: 13,
    marginTop: 3,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  formField: {
    flexGrow: 1,
    flexBasis: 280,
    gap: 7,
  },
  formLabel: {
    color: "#4B4B4B",
    fontSize: 13,
    fontWeight: "700",
  },
  formInputWrapper: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F1C4C7",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  formInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    padding: 0,
    color: "#424242",
    fontSize: 14,
    outlineStyle: "none",
  },
  accountDefaults: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 22,
    padding: 13,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  accountDefaultsText: {
    flex: 1,
    gap: 3,
  },
  accountDefaultsTitle: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
  },
  accountDefaultsSubtitle: {
    color: "#3F6B4A",
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 22,
    borderRadius: 8,
    backgroundColor: "#FF7F86",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  successText: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "500",
  },
  primaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  subText: {
    fontSize: 12,
    color: "#64748B",
  },
  cellText: {
    fontSize: 13,
    color: "#334155",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  detailBtnText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#16A34A",
  },
  approveBtnText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectBtnText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  statusToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  blockBtn: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  blockBtnText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
  },
  unblockBtn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  unblockBtnText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },
  detailsContent: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  confirmModalText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
  },
  confirmTargetName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
});

export default CustomerScreen;
