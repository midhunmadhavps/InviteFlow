import React, { useRef, useState, useEffect } from "react";
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
  updateEventStatusApi,
} from "../api/admin.api";

const EVENT_STATUSES = ["Draft", "Active", "Completed", "Cancelled"];

const getEventMediaUrl = (media) => {
  if (!media) return "";
  if (/^https?:\/\//i.test(media)) return media;
  if (media.startsWith("/uploads/")) return `http://localhost:3000${media}`;
  return `http://localhost:3000/uploads/${encodeURIComponent(media)}`;
};

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
  const [eventStatusPicker, setEventStatusPicker] = useState(null);
  const [actionMenuEvent, setActionMenuEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [selectedHostImage, setSelectedHostImage] = useState(null);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [hostImagePreviewUrl, setHostImagePreviewUrl] = useState("");
  const [invitationPreviewUrl, setInvitationPreviewUrl] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const hostImageInput = useRef(null);
  const invitationInput = useRef(null);

  useEffect(() => {
    if (!selectedHostImage) {
      setHostImagePreviewUrl("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(selectedHostImage);
    setHostImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedHostImage]);

  useEffect(() => {
    if (!selectedInvitation) {
      setInvitationPreviewUrl("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(selectedInvitation);
    setInvitationPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedInvitation]);

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
        : confirmAction.type === "status"
          ? await updateEventStatusApi(
              confirmAction.event._id,
              confirmAction.status
            )
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
    setEditError("");
    setEditForm({
      title: event.title || "",
      status: event.status || "Draft",
      hostOne: event.hostOne || "",
      hostTwo: event.hostTwo || "",
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 10) : "",
      eventTime: event.eventTime || "",
      address: event.address || "",
      locationAddress: event.location?.address || (typeof event.location === "string" ? event.location : ""),
      latitude: event.location?.latitude == null ? "" : String(event.location.latitude),
      longitude: event.location?.longitude == null ? "" : String(event.location.longitude),
      googleMapsUrl: event.location?.googleMapsUrl || "",
      message: event.message || "",
    });
    setSelectedHostImage(null);
    setSelectedInvitation(null);
    setEditingEvent(event);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent || !editForm) return;
    if (
      !editForm.title.trim() ||
      !editForm.hostOne.trim() ||
      !editForm.eventDate ||
      !editForm.eventTime ||
      !editForm.locationAddress.trim() ||
      !editForm.address.trim()
    ) {
      setEditError("Title, primary host, date, time, event location, and event address are required.");
      return;
    }
    if (selectedHostImage && !/^image\/(jpeg|png|webp)$/.test(selectedHostImage.type)) {
      setEditError("Host photo must be a JPG, PNG, or WEBP image.");
      return;
    }
    if (selectedHostImage && selectedHostImage.size > 5 * 1024 * 1024) {
      setEditError("Host photo must be 5 MB or smaller.");
      return;
    }
    if (selectedInvitation) {
      const invitationIsImage = /^image\/(jpeg|png|webp)$/.test(selectedInvitation.type);
      const invitationIsPdf = selectedInvitation.type === "application/pdf";
      if (!invitationIsImage && !invitationIsPdf) {
        setEditError("Invitation must be a JPG, PNG, WEBP, or PDF file.");
        return;
      }
      if (selectedInvitation.size > (invitationIsPdf ? 10 : 5) * 1024 * 1024) {
        setEditError(`Invitation ${invitationIsPdf ? "PDF" : "image"} exceeds the allowed file size.`);
        return;
      }
    }

    const latitude = editForm.latitude.trim() ? Number(editForm.latitude) : null;
    const longitude = editForm.longitude.trim() ? Number(editForm.longitude) : null;
    if (
      (latitude !== null && !Number.isFinite(latitude)) ||
      (longitude !== null && !Number.isFinite(longitude))
    ) {
      setEditError("Latitude and longitude must be valid numbers.");
      return;
    }

    setActionLoading(true);
    setEditError("");
    setSuccessMessage("");
    try {
      const payload = new FormData();
      payload.append("title", editForm.title.trim());
      payload.append("status", editForm.status);
      payload.append("hostOne", editForm.hostOne.trim());
      payload.append("hostTwo", editForm.hostTwo.trim());
      payload.append("eventDate", editForm.eventDate);
      payload.append("eventTime", editForm.eventTime);
      payload.append("address", editForm.address.trim());
      payload.append("location", JSON.stringify({
        address: editForm.locationAddress.trim(),
        latitude,
        longitude,
        googleMapsUrl: editForm.googleMapsUrl.trim(),
      }));
      payload.append("message", editForm.message);
      if (selectedHostImage) payload.append("hostOneImage", selectedHostImage);
      if (selectedInvitation) payload.append("invitation", selectedInvitation);

      const response = await updateEventApi(editingEvent._id, payload);
      setEditingEvent(null);
      setEditForm(null);
      setEditError("");
      setSelectedHostImage(null);
      setSelectedInvitation(null);
      setSuccessMessage(response.message || "Event updated successfully.");
      await fetchEvents(page, search);
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || "Failed to update event.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditClose = () => {
    if (!actionLoading) {
      setEditingEvent(null);
      setEditForm(null);
      setEditError("");
      setSelectedHostImage(null);
      setSelectedInvitation(null);
    }
  };

  const eventTypeName = (
    editingEvent?.eventTypeId?.name ||
    (typeof editingEvent?.eventTypeId === "string" ? editingEvent.eventTypeId : "")
  ).trim().toLowerCase();
  const allowsSecondHost = ["wedding", "anniversary", "engagement"].includes(eventTypeName);

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
      renderCell: (row) => (
        <TouchableOpacity
          style={styles.rowStatusButton}
          onPress={(event) => {
            event.stopPropagation();
            setEventStatusPicker(row);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Change event status, currently ${row.status || "Draft"}`}
        >
          <StatusBadge status={row.status} />
        </TouchableOpacity>
      ),
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
          accessibilityLabel={`Change event access, currently ${row.isEnabled === false ? "Disable" : "Enable"}`}
        >
          <Text style={[styles.accessSelectText, !row.isEnabled && styles.accessSelectTextDisabled]}>
            {row.isEnabled === false ? "Disable" : "Enable"}
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
            {selectedEvent.hostOneImage ? (
              <View style={styles.mediaPreviewSection}>
                <Text style={styles.detailLabel}>Host photo</Text>
                <img
                  src={getEventMediaUrl(selectedEvent.hostOneImage)}
                  alt="Event host"
                  style={styles.invitationImagePreview}
                />
              </View>
            ) : null}
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
                {selectedEvent.isEnabled === false ? "Disable" : "Enable"}
              </Text>
            </View>
            {selectedEvent.invitation ? (
              <View style={styles.mediaPreviewSection}>
                <Text style={styles.detailLabel}>Invitation</Text>
                {/\.pdf(?:$|[?#])/i.test(selectedEvent.invitation) ? (
                  <iframe
                    title="Event invitation PDF"
                    src={getEventMediaUrl(selectedEvent.invitation)}
                    style={styles.invitationPdfPreview}
                  />
                ) : (
                  <img
                    src={getEventMediaUrl(selectedEvent.invitation)}
                    alt="Event invitation"
                    style={styles.invitationImagePreview}
                  />
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </Modal>

      <Modal
        visible={Boolean(eventStatusPicker)}
        onClose={() => setEventStatusPicker(null)}
        title="Change Event Status"
        hideActions
      >
        <Text style={styles.pickerDescription}>
          Select a status for {eventStatusPicker?.title}. You will be asked to confirm the change.
        </Text>
        {EVENT_STATUSES.map((status) => (
          <TouchableOpacity
            key={status}
            style={styles.eventStatusOption}
            onPress={() => {
              const event = eventStatusPicker;
              setEventStatusPicker(null);
              if (event?.status !== status) {
                setConfirmAction({ type: "status", event, status });
              }
            }}
          >
            <View style={styles.eventStatusOptionContent}>
              <StatusBadge status={status} />
            </View>
            {eventStatusPicker?.status === status ? (
              <View style={styles.eventStatusCheck}>
                <MaterialCommunityIcons name="check" size={20} color="#4F46E5" />
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </Modal>

      <Modal
        visible={Boolean(statusPickerEvent)}
        onClose={() => setStatusPickerEvent(null)}
        title="Change Event Access"
        hideActions
      >
        <Text style={styles.pickerDescription}>
          Choose whether this event should be enabled or disabled. You will be asked to confirm the change.
        </Text>
        {[
          { label: "Enable", value: true, icon: "check-circle-outline", color: "#16A34A" },
          { label: "Disable", value: false, icon: "cancel", color: "#DC2626" },
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
          handleEditClose();
        }}
        title="Edit Event"
        confirmText="Save Changes"
        confirmColor="#4F46E5"
        isConfirming={actionLoading}
        onConfirm={handleSaveEvent}
      >
        {editForm ? (
          <View style={styles.editForm}>
            {editError ? <Text style={styles.editError}>{editError}</Text> : null}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Host photo</Text>
              <input
                ref={hostImageInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={styles.hiddenFileInput}
                onChange={(event) => setSelectedHostImage(event.target.files?.[0] || null)}
              />
              <View style={styles.filePickerRow}>
                <TouchableOpacity style={styles.filePickerButton} onPress={() => hostImageInput.current?.click()}>
                  <MaterialCommunityIcons name="image-outline" size={18} color="#4F46E5" />
                  <Text style={styles.filePickerButtonText}>Choose host photo</Text>
                </TouchableOpacity>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedHostImage?.name || (editingEvent.hostOneImage ? "Current photo kept" : "No photo selected")}
                </Text>
              </View>
              {(hostImagePreviewUrl || editingEvent.hostOneImage) ? (
                <img
                  src={hostImagePreviewUrl || getEventMediaUrl(editingEvent.hostOneImage)}
                  alt={selectedHostImage?.name || "Current host photo"}
                  style={styles.invitationImagePreview}
                />
              ) : null}
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Status</Text>
              <select
                value={editForm.status}
                onChange={(event) => updateEditField("status", event.target.value)}
                style={styles.webSelectInput}
              >
                {EVENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </View>

            <View style={styles.editField}>
              <Text style={styles.editLabel}>Event title</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.title}
                onChangeText={(value) => updateEditField("title", value)}
                placeholder="Enter event title"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>{allowsSecondHost ? "First host name" : "Host name"}</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.hostOne}
                onChangeText={(value) => updateEditField("hostOne", value)}
                placeholder="Enter host name"
                placeholderTextColor="#94A3B8"
              />
            </View>
            {allowsSecondHost ? (
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Second host name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.hostTwo}
                  onChangeText={(value) => updateEditField("hostTwo", value)}
                  placeholder="Enter second host / partner name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            ) : null}
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Event date</Text>
              <input
                type="date"
                value={editForm.eventDate}
                onChange={(event) => updateEditField("eventDate", event.target.value)}
                style={styles.webDateTimeInput}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Event time</Text>
              <input
                type="time"
                value={editForm.eventTime}
                onChange={(event) => updateEditField("eventTime", event.target.value)}
                style={styles.webDateTimeInput}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Event location</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.locationAddress}
                onChangeText={(value) => updateEditField("locationAddress", value)}
                placeholder="Enter event location"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.editLocationGrid}>
              <View style={[styles.editField, styles.editLocationField]}>
                <Text style={styles.editLabel}>Latitude</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.latitude}
                  onChangeText={(value) => updateEditField("latitude", value)}
                  placeholder="Optional"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.editField, styles.editLocationField]}>
                <Text style={styles.editLabel}>Longitude</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.longitude}
                  onChangeText={(value) => updateEditField("longitude", value)}
                  placeholder="Optional"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Google Maps URL</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.googleMapsUrl}
                onChangeText={(value) => updateEditField("googleMapsUrl", value)}
                placeholder="Optional map link"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Event address / venue</Text>
              <TextInput
                style={[styles.editInput, styles.editMultilineInput]}
                value={editForm.address}
                onChangeText={(value) => updateEditField("address", value)}
                placeholder="Enter event address / venue"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Invitation message</Text>
              <TextInput
                style={[styles.editInput, styles.editMultilineInput]}
                value={editForm.message}
                onChangeText={(value) => updateEditField("message", value)}
                placeholder="Enter invitation message"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>Invitation file (PDF or image)</Text>
              <input
                ref={invitationInput}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                style={styles.hiddenFileInput}
                onChange={(event) => setSelectedInvitation(event.target.files?.[0] || null)}
              />
              <View style={styles.filePickerRow}>
                <TouchableOpacity style={styles.filePickerButton} onPress={() => invitationInput.current?.click()}>
                  <MaterialCommunityIcons name="file-image-outline" size={18} color="#4F46E5" />
                  <Text style={styles.filePickerButtonText}>Choose invitation</Text>
                </TouchableOpacity>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedInvitation?.name || (editingEvent.invitation ? "Current invitation kept" : "No file selected")}
                </Text>
              </View>
              {(invitationPreviewUrl || editingEvent.invitation) ? (
                selectedInvitation?.type === "application/pdf" ||
                (!selectedInvitation && /\.pdf(?:$|[?#])/i.test(editingEvent.invitation || "")) ? (
                  <iframe
                    title={selectedInvitation?.name || "Current invitation PDF"}
                    src={invitationPreviewUrl || getEventMediaUrl(editingEvent.invitation)}
                    style={styles.invitationPdfPreview}
                  />
                ) : (
                  <img
                    src={invitationPreviewUrl || getEventMediaUrl(editingEvent.invitation)}
                    alt={selectedInvitation?.name || "Current invitation image"}
                    style={styles.invitationImagePreview}
                  />
                )
              ) : null}
            </View>
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
            : confirmAction?.type === "status"
              ? `Are you sure you want to change this event status to ${confirmAction.status}?`
              : `Are you sure you want to ${confirmAction?.isEnabled ? "enable" : "disable"} this event?`}
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
  webSelectInput: {
    width: "100%",
    minHeight: 42,
    boxSizing: "border-box",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    color: "#0F172A",
    fontSize: 14,
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
  eventStatusOption: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },
  eventStatusOptionContent: {
    flex: 1,
    minHeight: 34,
    justifyContent: "center",
  },
  eventStatusCheck: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
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
  rowStatusButton: {
    alignSelf: "flex-start",
    padding: 2,
  },
  editError: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 19,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 7,
    backgroundColor: "#FEF2F2",
  },
  editField: {
    gap: 6,
  },
  editLocationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  editLocationField: {
    flex: 1,
    minWidth: 160,
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
  editMultilineInput: {
    minHeight: 82,
    paddingTop: 10,
  },
  webDateTimeInput: {
    width: "100%",
    minHeight: 42,
    boxSizing: "border-box",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    color: "#0F172A",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  hiddenFileInput: {
    display: "none",
  },
  invitationImagePreview: {
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  invitationPdfPreview: {
    width: "100%",
    height: 300,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
  },
  filePickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  filePickerButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 7,
    backgroundColor: "#EEF2FF",
  },
  filePickerButtonText: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "600",
  },
  fileName: {
    flexShrink: 1,
    color: "#64748B",
    fontSize: 12,
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
  mediaPreviewSection: {
    gap: 8,
    paddingTop: 8,
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
