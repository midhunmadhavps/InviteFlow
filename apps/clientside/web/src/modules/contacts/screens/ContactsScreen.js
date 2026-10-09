import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DataTable from "../../../components/DataTable";
import { getContactsApi } from "../api/contact.api";

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
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
        setContacts(res.data.contacts || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
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
      title: "Contact Name",
      field: "name",
      width: 200,
      renderCell: (row) => <Text style={styles.primaryText}>{row.name || "Unnamed"}</Text>,
    },
    {
      title: "Phone Number",
      field: "phone",
      width: 160,
      renderCell: (row) => <Text style={styles.cellText}>{row.phone || "-"}</Text>,
    },
    {
      title: "Email",
      field: "email",
      width: 220,
      renderCell: (row) => <Text style={styles.cellText}>{row.email || "N/A"}</Text>,
    },
    {
      title: "Customer Account",
      width: 200,
      renderCell: (row) => (
        <View>
          <Text style={styles.primaryText}>
            {row.userId ? `${row.userId.firstName || ""} ${row.userId.lastName || ""}`.trim() : "Unknown"}
          </Text>
          <Text style={styles.subText}>{row.userId?.email || row.userId?.phone || "N/A"}</Text>
        </View>
      ),
    },
    {
      title: "Added On",
      width: 140,
      renderCell: (row) => (
        <Text style={styles.cellText}>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
        </Text>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Global Guest Contacts</Text>
          <Text style={styles.headerSubtitle}>
            Aggregated address book across customer invitation rosters
          </Text>
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
        searchPlaceholder="Search contacts by name, phone, email..."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={(p) => fetchContacts(p, search)}
        emptyMessage="No contacts found."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
  cellText: {
    fontSize: 13,
    color: "#334155",
  },
});

export default ContactsScreen;
