import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";
import {
  deleteEventApi,
  getEventsApi,
  updateEventApi,
  updateEventEnabledApi,
} from "../api/admin.api";

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [statusPickerEvent, setStatusPickerEvent] = useState(null);
  const [actionMenuEvent, setActionMenuEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      setError(err.response?.data?.message || err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setActionLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = confirmAction.type === "delete"
        ? await deleteEventApi(confirmAction.event._id)
        : await updateEventEnabledApi(
            confirmAction.event._id,
            confirmAction.isEnabled
          );

      setConfirmAction(null);
      setSuccessMessage(response.message || "Event updated successfully.");
      const refreshPage = confirmAction.type === "delete" && events.length === 1 && page > 1
        ? page - 1
        : page;
      await fetchEvents(refreshPage, search);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update event.");
    } finally {
      setActionLoading(false);
    }
  };

  const openEventEditor = (event) => {
    setEditForm({
      title: event.title || "",
      hostOne: event.hostOne || "",
      hostTwo: event.hostTwo || "",
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 10) : "",
      eventTime: event.eventTime || "",
      address: event.address || "",
    });
    setEditingEvent(event);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent || !editForm) return;
    if (!editForm.title.trim() || !editForm.hostOne.trim() || !editForm.eventDate) {
      setError("Event title, primary host, and event date are required.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await updateEventApi(editingEvent._id, {
        ...editForm,
        title: editForm.title.trim(),
        hostOne: editForm.hostOne.trim(),
        hostTwo: editForm.hostTwo.trim(),
        address: editForm.address.trim(),
      });
      setEditingEvent(null);
      setEditForm(null);
      setSuccessMessage(response.message || "Event updated successfully.");
      await fetchEvents(page, search);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update event.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectEventAction = (action) => {
    const event = actionMenuEvent;
    setActionMenuEvent(null);
    if (!event) return;

    if (action === "view") {
      setSelectedEvent(event);
      setDetailsModalVisible(true);
    } else if (action === "edit") {
      setError("");
      openEventEditor(event);
    } else {
      setError("");
      setConfirmAction({ type: "delete", event });
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
      title: "Access",
      width: 140,
      renderCell: (row) => (
        <TouchableOpacity
          style={[styles.accessSelect, !row.isEnabled && styles.accessSelectDisabled]}
          onPress={(event) => {
            event.stopPropagation();
            setStatusPickerEvent(row);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Change event access, currently ${row.isEnabled === false ? "disabled" : "active"}`}
        >
          <Text style={[styles.accessSelectText, !row.isEnabled && styles.accessSelectTextDisabled]}>
            {row.isEnabled === false ? "Disabled" : "Active"}
          </Text>
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

      {successMessage ? (
        <View style={styles.successBanner}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <DataTable
        columns={columns}
        data={events}
        onRowPress={(row) => setActionMenuEvent(row)}
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
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Access</Text>
              <Text style={styles.detailValue}>
                {selectedEvent.isEnabled === false ? "Disabled" : "Active"}
              </Text>
            </View>
          </View>
        ) : null}
      </Modal>

      <Modal
        visible={Boolean(statusPickerEvent)}
        onClose={() => setStatusPickerEvent(null)}
        title="Change Event Access"
        hideActions
      >
        <Text style={styles.pickerDescription}>
          Choose whether this event should be active or disabled. You will be asked to confirm the change.
        </Text>
        {[
          { label: "Active", value: true, icon: "check-circle-outline", color: "#16A34A" },
          { label: "Disabled", value: false, icon: "cancel", color: "#DC2626" },
        ].map((option) => (
          <TouchableOpacity
            key={option.label}
            style={styles.pickerOption}
            onPress={() => {
              const event = statusPickerEvent;
              setStatusPickerEvent(null);
              if (event.isEnabled !== option.value) {
                setConfirmAction({
                  type: "access",
                  event,
                  isEnabled: option.value,
                });
              }
            }}
          >
            <MaterialCommunityIcons name={option.icon} size={20} color={option.color} />
            <Text style={styles.pickerOptionText}>{option.label}</Text>
            {statusPickerEvent?.isEnabled === option.value ? (
              <MaterialCommunityIcons name="check" size={18} color={option.color} />
            ) : null}
          </TouchableOpacity>
        ))}
      </Modal>

      <Modal
        visible={Boolean(actionMenuEvent)}
        onClose={() => setActionMenuEvent(null)}
        title="Event Actions"
        hideActions
      >
        <Text style={styles.pickerDescription}>
          Choose an action for {actionMenuEvent?.title}.
        </Text>
        {[
          { label: "View", value: "view", icon: "eye-outline", color: "#4F46E5" },
          { label: "Edit", value: "edit", icon: "pencil-outline", color: "#0369A1" },
          { label: "Delete", value: "delete", icon: "trash-can-outline", color: "#DC2626" },
        ].map((action) => (
          <TouchableOpacity
            key={action.value}
            style={styles.pickerOption}
            onPress={() => handleSelectEventAction(action.value)}
          >
            <MaterialCommunityIcons name={action.icon} size={20} color={action.color} />
            <Text style={[styles.pickerOptionText, action.value === "delete" && styles.deleteActionText]}>
              {action.label}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </Modal>

      <Modal
        visible={Boolean(editingEvent)}
        onClose={() => {
          if (!actionLoading) {
            setEditingEvent(null);
            setEditForm(null);
          }
        }}
        title="Edit Event"
        confirmText="Save Changes"
        confirmColor="#4F46E5"
        isConfirming={actionLoading}
        onConfirm={handleSaveEvent}
      >
        {editForm ? (
          <View style={styles.editForm}>
            {[
              { key: "title", label: "Event title", placeholder: "Enter event title" },
              { key: "hostOne", label: "Primary host", placeholder: "Enter primary host" },
              { key: "hostTwo", label: "Secondary host", placeholder: "Enter secondary host" },
              { key: "eventDate", label: "Event date (YYYY-MM-DD)", placeholder: "YYYY-MM-DD" },
              { key: "eventTime", label: "Event time", placeholder: "e.g. 6:30 PM" },
              { key: "address", label: "Venue / address", placeholder: "Enter venue or address" },
            ].map((field) => (
              <View key={field.key} style={styles.editField}>
                <Text style={styles.editLabel}>{field.label}</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm[field.key]}
                  onChangeText={(value) => setEditForm((current) => ({ ...current, [field.key]: value }))}
                  placeholder={field.placeholder}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="sentences"
                />
              </View>
            ))}
          </View>
        ) : null}
      </Modal>

      <Modal
        visible={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === "delete" ? "Delete Event" : "Confirm Access Change"}
        confirmText={confirmAction?.type === "delete" ? "Yes, Delete" : "Confirm Change"}
        confirmColor={confirmAction?.type === "delete" || !confirmAction?.isEnabled ? "#DC2626" : "#16A34A"}
        isConfirming={actionLoading}
        onConfirm={handleConfirmAction}
      >
        <Text style={styles.confirmText}>
          {confirmAction?.type === "delete"
            ? "This will permanently delete this event. This action cannot be undone."
            : `Are you sure you want to set this event to ${confirmAction?.isEnabled ? "Active" : "Disabled"}?`}
        </Text>
        <Text style={styles.confirmEventTitle}>{confirmAction?.event?.title}</Text>
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
  accessSelect: {
    minWidth: 104,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  accessSelectDisabled: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  accessSelectText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "700",
  },
  accessSelectTextDisabled: {
    color: "#DC2626",
  },
  pickerDescription: {
    marginBottom: 12,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },
  pickerOption: {
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
  pickerOptionText: {
    flex: 1,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteActionText: {
    color: "#DC2626",
  },
  editForm: {
    gap: 14,
  },
  editField: {
    gap: 6,
  },
  editLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  editInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    color: "#0F172A",
    fontSize: 14,
    outlineStyle: "none",
  },
  confirmText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  confirmEventTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
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
