import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
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
  updateUserAccessApi,
  updateCustomerApi,
  deleteCustomerApi,
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
  const [actionMenuUser, setActionMenuUser] = useState(null);
  const [statusPickerUser, setStatusPickerUser] = useState(null);
  const [accessPickerUser, setAccessPickerUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    action: null,
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
        limit: 5,
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
      } else if (action === "block" || action === "activate") {
        const status = action === "block" ? "Blocked" : "Active";
        const res = await updateUserStatusApi(user._id, status);
        setSuccessMessage(res.message || `Customer status updated to ${status}.`);
      } else if (action === "enableAccess" || action === "disableAccess") {
        const isEnabled = action === "enableAccess";
        const res = await updateUserAccessApi(user._id, isEnabled);
        setSuccessMessage(res.message || `Customer access ${isEnabled ? "enabled" : "disabled"}.`);
      } else if (action === "delete") {
        const res = await deleteCustomerApi(user._id);
        setSuccessMessage(res.message || `Customer account for ${user.firstName} deleted.`);
      }
      setConfirmModal({ visible: false, action: null, user: null });
      await fetchUsers(page, statusFilter, search);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${action} customer account.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmModal = (action, user) => {
    setError("");
    setSuccessMessage("");
    setConfirmModal({ visible: true, action, user });
  };

  const openUserEditor = (user) => {
    setEditError("");
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      confirmPassword: "",
    });
    setEditingUser(user);
  };

  const handleSaveCustomer = async () => {
    if (!editingUser || !editForm) return;

    const customer = {
      ...editForm,
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
    };
    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phone) {
      setEditError("First name, last name, email, and phone are required.");
      return;
    }
    if (customer.password !== customer.confirmPassword) {
      setEditError("Passwords do not match.");
      return;
    }

    setActionLoading(true);
    setEditError("");
    setSuccessMessage("");
    try {
      const response = await updateCustomerApi(editingUser._id, customer);
      setEditingUser(null);
      setEditForm(null);
      setSuccessMessage(response.message || "Customer updated successfully.");
      await fetchUsers(page, statusFilter, search);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update customer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectUserAction = (action) => {
    const user = actionMenuUser;
    setActionMenuUser(null);
    if (!user) return;

    if (action === "view") {
      setSelectedUser(user);
      setDetailsModalVisible(true);
    } else if (action === "edit") {
      setError("");
      openUserEditor(user);
    } else {
      openConfirmModal("delete", user);
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
      width: 190,
      renderCell: (row) => (
        <View style={styles.statusCell}>
          {row.status === "Active" || row.status === "Blocked" ? (
            <Pressable
              style={styles.statusPickerButton}
              onPress={(event) => {
                event.stopPropagation();
                setStatusPickerUser(row);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Change customer status, currently ${row.status}`}
            >
              <StatusBadge status={row.status} />
            </Pressable>
          ) : (
            <StatusBadge status={row.status} />
          )}
          {row.status === "Pending" && (
            <View style={styles.statusActions}>
              <Pressable
                style={styles.approveBtn}
                onPress={(event) => {
                  event.stopPropagation();
                  openConfirmModal("approve", row);
                }}
              >
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </Pressable>
              <Pressable
                style={styles.rejectBtn}
                onPress={(event) => {
                  event.stopPropagation();
                  openConfirmModal("reject", row);
                }}
              >
                <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                <Text style={styles.rejectBtnText}>Block</Text>
              </Pressable>
            </View>
          )}
        </View>
      ),
    },
    {
      title: "Access",
      width: 130,
      renderCell: (row) => (
        <Pressable
          style={[
            styles.customerAccessButton,
            row.isEnabled === false && styles.customerAccessButtonDisabled,
          ]}
          onPress={(event) => {
            event.stopPropagation();
            setAccessPickerUser(row);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Change customer access, currently ${row.isEnabled === false ? "Disable" : "Enable"}`}
        >
          <Text
            style={[
              styles.customerAccessText,
              row.isEnabled === false && styles.customerAccessTextDisabled,
            ]}
          >
            {row.isEnabled === false ? "Disable" : "Enable"}
          </Text>
        </Pressable>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator
      >
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
          <View style={styles.registrationScroll}>
            <View style={styles.registrationScrollContent}>
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
            </View>
          </View>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            onRowPress={(user) => {
              setError("");
              setSuccessMessage("");
              setActionMenuUser(user);
            }}
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
      </ScrollView>

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
              <Text style={styles.detailLabel}>Access</Text>
              <Text style={styles.detailValue}>
                {selectedUser.isEnabled === false ? "Disable" : "Enable"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone Verified</Text>
              <Text style={styles.detailValue}>{selectedUser.isPhoneVerified ? "✅ Yes" : "❌ No"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email Verified</Text>
              <Text style={styles.detailValue}>{selectedUser.isEmailVerified ? "✅ Yes" : "❌ No"}</Text>
            </View>
          </View>
        ) : null}
      </Modal>

      <Modal
        visible={Boolean(accessPickerUser)}
        onClose={() => setAccessPickerUser(null)}
        title="Change Customer Access"
        hideActions
      >
        <Text style={styles.actionMenuDescription}>
          Choose whether {accessPickerUser?.firstName} {accessPickerUser?.lastName} can access the customer app.
        </Text>
        {[
          { label: "Enable", value: true, icon: "check-circle-outline", color: "#16A34A" },
          { label: "Disable", value: false, icon: "cancel", color: "#DC2626" },
        ].map((option) => (
          <TouchableOpacity
            key={option.label}
            style={styles.actionMenuOption}
            onPress={() => {
              const user = accessPickerUser;
              setAccessPickerUser(null);
              if ((user.isEnabled !== false) !== option.value) {
                openConfirmModal(option.value ? "enableAccess" : "disableAccess", user);
              }
            }}
          >
            <MaterialCommunityIcons name={option.icon} size={20} color={option.color} />
            <Text style={styles.actionMenuOptionText}>{option.label}</Text>
            {(accessPickerUser?.isEnabled !== false) === option.value ? (
              <MaterialCommunityIcons name="check" size={18} color={option.color} />
            ) : null}
          </TouchableOpacity>
        ))}
      </Modal>

      <Modal
        visible={Boolean(statusPickerUser)}
        onClose={() => setStatusPickerUser(null)}
        title="Change Customer Status"
        hideActions
      >
        <Text style={styles.actionMenuDescription}>
          Choose whether {statusPickerUser?.firstName} {statusPickerUser?.lastName} should be active or blocked.
        </Text>
        {[
          { label: "Active", value: "Active", icon: "check-circle-outline", color: "#16A34A" },
          { label: "Blocked", value: "Blocked", icon: "cancel", color: "#DC2626" },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.actionMenuOption}
            onPress={() => {
              const user = statusPickerUser;
              setStatusPickerUser(null);
              if (user.status !== option.value) {
                openConfirmModal(option.value === "Blocked" ? "block" : "activate", user);
              }
            }}
          >
            <MaterialCommunityIcons name={option.icon} size={20} color={option.color} />
            <Text style={styles.actionMenuOptionText}>{option.label}</Text>
            {statusPickerUser?.status === option.value ? (
              <MaterialCommunityIcons name="check" size={18} color={option.color} />
            ) : null}
          </TouchableOpacity>
        ))}
      </Modal>

      <Modal
        visible={Boolean(actionMenuUser)}
        onClose={() => setActionMenuUser(null)}
        title="Customer Actions"
        hideActions
      >
        <Text style={styles.actionMenuDescription}>
          Choose an action for {actionMenuUser?.firstName} {actionMenuUser?.lastName}.
        </Text>
        {[
          { label: "View", value: "view", icon: "eye-outline", color: "#4F46E5" },
          { label: "Edit", value: "edit", icon: "pencil-outline", color: "#0369A1" },
          { label: "Delete", value: "delete", icon: "trash-can-outline", color: "#DC2626" },
        ].map((action) => (
          <TouchableOpacity
            key={action.value}
            style={styles.actionMenuOption}
            onPress={() => handleSelectUserAction(action.value)}
          >
            <MaterialCommunityIcons name={action.icon} size={20} color={action.color} />
            <Text style={[
              styles.actionMenuOptionText,
              action.value === "delete" && styles.deleteActionText,
            ]}>
              {action.label}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </Modal>

      <Modal
        visible={Boolean(editingUser)}
        onClose={() => {
          if (!actionLoading) {
            setEditingUser(null);
            setEditForm(null);
            setEditError("");
          }
        }}
        title="Edit Customer"
        confirmText="Save Changes"
        confirmColor="#4F46E5"
        isConfirming={actionLoading}
        onConfirm={handleSaveCustomer}
      >
        {editForm ? (
          <View style={styles.customerEditForm}>
            {editError ? <Text style={styles.customerEditError}>{editError}</Text> : null}
            {[
              { key: "firstName", label: "First name", placeholder: "Enter first name" },
              { key: "lastName", label: "Last name", placeholder: "Enter last name" },
              { key: "email", label: "Email", placeholder: "name@example.com", keyboardType: "email-address" },
              { key: "phone", label: "Phone", placeholder: "10-digit phone number", keyboardType: "phone-pad" },
              { key: "password", label: "New password (optional)", placeholder: "Leave blank to keep current password", secureTextEntry: true },
              { key: "confirmPassword", label: "Confirm new password", placeholder: "Re-enter new password", secureTextEntry: true },
            ].map((field) => (
              <View key={field.key} style={styles.customerEditField}>
                <Text style={styles.customerEditLabel}>{field.label}</Text>
                <TextInput
                  style={styles.customerEditInput}
                  value={editForm[field.key]}
                  onChangeText={(value) => setEditForm((current) => ({
                    ...current,
                    [field.key]: value,
                  }))}
                  placeholder={field.placeholder}
                  placeholderTextColor="#94A3B8"
                  keyboardType={field.keyboardType || "default"}
                  autoCapitalize={field.key === "email" ? "none" : "words"}
                  secureTextEntry={field.secureTextEntry || false}
                />
              </View>
            ))}
          </View>
        ) : null}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        onClose={() => setConfirmModal({ visible: false, action: null, user: null })}
        title={{
          approve: "Approve Customer Account",
          reject: "Block Customer Account",
          block: "Block Customer Account",
          activate: "Activate Customer Account",
          enableAccess: "Enable Customer Access",
          disableAccess: "Disable Customer Access",
          delete: "Delete Customer Account",
        }[confirmModal.action] || "Confirm Customer Action"}
        confirmText={{
          approve: "Yes, Approve",
          reject: "Yes, Block",
          block: "Yes, Block",
          activate: "Yes, Activate",
          enableAccess: "Yes, Enable",
          disableAccess: "Yes, Disable",
          delete: "Yes, Delete",
        }[confirmModal.action] || "Confirm"}
        confirmColor={["approve", "activate", "enableAccess"].includes(confirmModal.action) ? "#16A34A" : "#DC2626"}
        isConfirming={actionLoading}
        onConfirm={handleExecuteAction}
      >
        <Text style={styles.confirmModalText}>
          {confirmModal.action === "delete"
            ? "This permanently deletes the customer account and its associated events, contacts, and verification codes. This action cannot be undone."
            : ["enableAccess", "disableAccess"].includes(confirmModal.action)
              ? `Are you sure you want to ${confirmModal.action === "enableAccess" ? "enable" : "disable"} app access for:`
            : `Are you sure you want to ${
                confirmModal.action === "activate"
                  ? "activate"
                  : confirmModal.action === "approve"
                    ? "approve"
                    : "block"
              } the customer account for:`}
        </Text>
        {confirmModal.action !== "delete" ? (
          <Text style={styles.confirmTargetName}>
            {confirmModal.user?.firstName} {confirmModal.user?.lastName} ({confirmModal.user?.email || confirmModal.user?.phone})
          </Text>
        ) : (
          <Text style={styles.confirmTargetName}>
            {confirmModal.user?.firstName} {confirmModal.user?.lastName}
          </Text>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  pageScroll: {
    flex: 1,
    minHeight: 0,
  },
  pageContent: {
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
    width: "100%",
  },
  registrationScrollContent: {
    alignItems: "center",
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
  statusCell: {
    alignItems: "flex-start",
    gap: 7,
  },
  statusPickerButton: {
    padding: 2,
    borderRadius: 18,
  },
  customerAccessButton: {
    minWidth: 86,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  customerAccessButtonDisabled: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  customerAccessText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "700",
  },
  customerAccessTextDisabled: {
    color: "#DC2626",
  },
  statusActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionMenuDescription: {
    marginBottom: 12,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },
  actionMenuOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginTop: 8,
  },
  actionMenuOptionText: {
    flex: 1,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteActionText: {
    color: "#DC2626",
  },
  customerEditForm: {
    gap: 14,
  },
  customerEditField: {
    gap: 6,
  },
  customerEditLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  customerEditInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    color: "#0F172A",
    fontSize: 14,
    outlineStyle: "none",
  },
  customerEditError: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 19,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 7,
    backgroundColor: "#FEF2F2",
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
  deleteBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
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
