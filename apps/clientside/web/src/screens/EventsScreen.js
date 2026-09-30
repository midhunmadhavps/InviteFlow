import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import { getEventsApi } from "../api/admin.api";

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const fetchEvents = async (currentPage = 1, currentSearch = search) => {
    setLoading(true);
    setError("");
    try {
      const res = await getEventsApi({
        page: currentPage,
        search: currentSearch,
        limit: 10,
      });
      if (res.success && res.data) {
        setEvents(res.data.events || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, search);
  }, []);

  const columns = [
    {
      title: "Event Title",
      width: 200,
      renderCell: (row) => (
        <View>
          <Text style={styles.primaryText}>{row.title}</Text>
          <Text style={styles.subText}>ID: {row.eventId}</Text>
        </View>
      ),
    },
    {
      title: "Type",
      width: 140,
      renderCell: (row) => (
        <View style={styles.typeCell}>
          <Text style={styles.typeIcon}>{row.eventTypeId?.icon || "✨"}</Text>
          <Text style={styles.cellText}>{row.eventTypeId?.name || "Other"}</Text>
        </View>
      ),
    },
    {
      title: "Hosts",
      width: 180,
      renderCell: (row) => (
        <View>
          <Text style={styles.cellText}>
            {row.hostOne} {row.hostTwo ? `& ${row.hostTwo}` : ""}
          </Text>
        </View>
      ),
    },
    {
      title: "Event Date",
      width: 150,
      renderCell: (row) => (
        <Text style={styles.cellText}>
          {row.eventDate ? new Date(row.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "-"}
        </Text>
      ),
    },
    {
      title: "Organizer",
      width: 180,
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
      title: "Status",
      width: 120,
      renderCell: (row) => <StatusBadge status={row.status} />,
    },
    {
      title: "Actions",
      width: 100,
      renderCell: (row) => (
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => {
            setSelectedEvent(row);
            setDetailsModalVisible(true);
          }}
        >
          <MaterialCommunityIcons name="eye-outline" size={16} color="#4F46E5" />
          <Text style={styles.detailBtnText}>View</Text>
        </TouchableOpacity>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Platform Events</Text>
          <Text style={styles.headerSubtitle}>
            Overview of all wedding, anniversary, birthday, and ceremony invitations
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
        data={events}
        loading={loading}
        searchValue={search}
        onSearchChange={(text) => {
          setSearch(text);
          fetchEvents(1, text);
        }}
        searchPlaceholder="Search by event title, ID, host..."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={(p) => fetchEvents(p, search)}
        emptyMessage="No events found on the platform."
      />

      {/* Event Details Modal */}
      <Modal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        title="Event Invitation Details"
        hideActions
      >
        {selectedEvent ? (
          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Title</Text>
              <Text style={styles.detailValue}>{selectedEvent.title}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Event ID</Text>
              <Text style={[styles.detailValue, { fontFamily: "monospace" }]}>
                {selectedEvent.eventId}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Event Type</Text>
              <Text style={styles.detailValue}>
                {selectedEvent.eventTypeId?.icon} {selectedEvent.eventTypeId?.name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Primary Host</Text>
              <Text style={styles.detailValue}>{selectedEvent.hostOne}</Text>
            </View>
            {selectedEvent.hostTwo ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Secondary Host</Text>
                <Text style={styles.detailValue}>{selectedEvent.hostTwo}</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {selectedEvent.eventDate ? new Date(selectedEvent.eventDate).toLocaleDateString() : ""} {selectedEvent.eventTime || ""}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Venue / Address</Text>
              <Text style={styles.detailValue}>{selectedEvent.address || "Not specified"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contacts Invited</Text>
              <Text style={styles.detailValue}>{selectedEvent.contacts?.length || 0} Guests</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <StatusBadge status={selectedEvent.status} />
            </View>
          </View>
        ) : null}
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
  typeCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeIcon: {
    fontSize: 16,
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
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
});

export default EventsScreen;
