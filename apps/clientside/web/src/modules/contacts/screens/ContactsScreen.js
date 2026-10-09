import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DataTable from "../../../components/DataTable";
import Modal from "../../../components/Modal";
import { getContactsApi } from "../api/contact.api";

const ContactsScreen = () => {
  const CONTACTS_PER_PAGE = 10;
  const [contacts, setContacts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [contactPage, setContactPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchContacts = async (currentPage = 1, currentSearch = search) => {
    setLoading(true);
    setError("");
    try {
      const res = await getContactsApi({
        page: currentPage,
        search: currentSearch,
        limit: 10,
      });
      if (res.success && res.data) {
        setContacts(res.data.customers || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setError(res.message || "Failed to load contacts.");
      }
    } catch (err) {
      setError(err.message || "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1, search);
  }, []);

  const columns = [
    {
      title: "Customer Name",
      flex: 3,
      width: 220,
      renderCell: (row) => {
        const customer = row.customer || {};
        const name = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
        return (
          <View>
            <Text style={styles.primaryText}>{name || "Unknown customer"}</Text>
            <Text style={styles.subText}>{customer.email || customer.phone || ""}</Text>
          </View>
        );
      },
    },
    {
      title: "Contacts",
      flex: 1,
      width: 130,
      renderCell: (row) => (
        <View style={styles.contactAction}>
          <View style={styles.contactCount}>
            <MaterialCommunityIcons name="account-box-multiple-outline" size={17} color="#4F46E5" />
            <Text style={styles.contactCountText}>{row.contacts?.length || 0}</Text>
          </View>
          <View style={styles.viewContactsLabel}>
            <Text style={styles.viewContactsText}>View contacts</Text>
            <MaterialCommunityIcons name="chevron-right" size={17} color="#4F46E5" />
          </View>
        </View>
      ),
    },
  ];
  const selectedContacts = selectedCustomer?.contacts || [];
  const filteredContacts = selectedContacts.filter((contact) => {
    const query = contactSearch.trim().toLowerCase();
    return !query
      || contact.name?.toLowerCase().includes(query)
      || contact.phoneNumber?.toLowerCase().includes(query);
  });
  const contactTotalPages = Math.max(1, Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE));
  const visibleContacts = filteredContacts.slice(
    (contactPage - 1) * CONTACTS_PER_PAGE,
    contactPage * CONTACTS_PER_PAGE
  );

  const openCustomerContacts = (customer) => {
    setSelectedCustomer(customer);
    setContactSearch("");
    setContactPage(1);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Customer Contacts</Text>
            <Text style={styles.headerSubtitle}>Browse customers and open their contact lists</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <DataTable
          columns={columns}
          data={contacts}
          loading={loading}
          searchValue={search}
          onSearchChange={(text) => {
            setSearch(text);
            fetchContacts(1, text);
          }}
          searchPlaceholder="Search customers or contacts..."
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(p) => fetchContacts(p, search)}
          onRowPress={openCustomerContacts}
          fillWidth
          alwaysShowPagination
          emptyMessage="No customer contacts found."
        />
      </ScrollView>

      <Modal
        visible={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={`${selectedCustomer?.customer?.firstName || ""} ${selectedCustomer?.customer?.lastName || ""}`.trim() || "Customer Contacts"}
        hideActions
      >
        <View style={styles.modalSearchBox}>
          <MaterialCommunityIcons name="magnify" size={19} color="#94A3B8" />
          <TextInput
            style={styles.modalSearchInput}
            placeholder="Search by contact name or number"
            placeholderTextColor="#94A3B8"
            value={contactSearch}
            onChangeText={(text) => {
              setContactSearch(text);
              setContactPage(1);
            }}
            accessibilityLabel="Search customer contacts"
          />
          {contactSearch ? (
            <TouchableOpacity
              onPress={() => {
                setContactSearch("");
                setContactPage(1);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear contact search"
            >
              <MaterialCommunityIcons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {visibleContacts.length ? (
          <>
            <View style={styles.contactList}>
              {visibleContacts.map((contact, index) => (
                <View key={contact._id || `${contact.phoneNumber}-${index}`} style={styles.contactRow}>
                <View style={styles.contactIdentity}>
                  <View style={styles.contactIcon}>
                    <MaterialCommunityIcons name="account-outline" size={18} color="#4F46E5" />
                  </View>
                  <Text style={styles.contactName}>{contact.name || "Unnamed contact"}</Text>
                </View>
                <Text style={styles.cellText}>{contact.phoneNumber || "-"}</Text>
                </View>
              ))}
            </View>
            <View style={styles.contactPagination}>
              <Text style={styles.contactPaginationInfo}>
                Showing {Math.min((contactPage - 1) * CONTACTS_PER_PAGE + 1, filteredContacts.length)}–
                {Math.min(contactPage * CONTACTS_PER_PAGE, filteredContacts.length)} of {filteredContacts.length} contacts
              </Text>
              <View style={styles.contactPaginationActions}>
                <TouchableOpacity
                  style={[styles.contactPageButton, contactPage <= 1 && styles.contactPageButtonDisabled]}
                  onPress={() => setContactPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={contactPage <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Previous contacts page"
                >
                  <MaterialCommunityIcons name="chevron-left" size={20} color={contactPage <= 1 ? "#CBD5E1" : "#475569"} />
                </TouchableOpacity>
                <Text style={styles.contactPageLabel}>Page {contactPage} of {contactTotalPages}</Text>
                <TouchableOpacity
                  style={[styles.contactPageButton, contactPage >= contactTotalPages && styles.contactPageButtonDisabled]}
                  onPress={() => setContactPage((currentPage) => Math.min(contactTotalPages, currentPage + 1))}
                  disabled={contactPage >= contactTotalPages}
                  accessibilityRole="button"
                  accessibilityLabel="Next contacts page"
                >
                  <MaterialCommunityIcons name="chevron-right" size={20} color={contactPage >= contactTotalPages ? "#CBD5E1" : "#475569"} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.emptyContactsText}>
            {selectedContacts.length
              ? "No contacts match your search."
              : "This customer has no contacts yet."}
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
  screenScroll: {
    flex: 1,
  },
  screenContent: {
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  primaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  subText: {
    fontSize: 12,
    color: "#64748B",
  },
  contactList: {
    gap: 8,
  },
  modalSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  modalSearchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    color: "#0F172A",
    outlineStyle: "none",
  },
  contactCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  contactAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  contactCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3730A3",
  },
  viewContactsLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewContactsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  contactIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
  },
  contactName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  cellText: {
    fontSize: 13,
    color: "#334155",
  },
  emptyContactsText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 24,
  },
  contactPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  contactPaginationInfo: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
  },
  contactPaginationActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactPageButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  contactPageButtonDisabled: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  contactPageLabel: {
    minWidth: 72,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
});

export default ContactsScreen;
