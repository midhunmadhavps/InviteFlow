import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createAdminEventApi } from "../../api/event.api";
import { getUsersApi } from "../../../customers/api/customer.api";

const EVENT_FORM_CONFIG = {
  Wedding: {
    eventName: "Wedding",
    firstHostLabel: "Groom name",
    secondHostLabel: "Bride name",
    imageLabel: "Couple photo",
    title: (first, second) => `${first} & ${second} Wedding`,
  },
  Anniversary: {
    eventName: "Anniversary",
    firstHostLabel: "Partner 1 name",
    secondHostLabel: "Partner 2 name",
    imageLabel: "Couple photo",
    title: (first, second) => `${first} & ${second} Anniversary`,
  },
  Engagement: {
    eventName: "Engagement",
    firstHostLabel: "Groom name",
    secondHostLabel: "Bride name",
    imageLabel: "Couple photo",
    title: (first, second) => `${first} & ${second} Engagement`,
  },
  Birthday: {
    eventName: "Birthday",
    firstHostLabel: "Name",
    imageLabel: "Birthday photo",
    title: (first) => `${first}'s Birthday`,
  },
};

const EventRegistrationForm = ({ eventType, eventName, onCancel, onCreated }) => {
  const config = EVENT_FORM_CONFIG[eventName];
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState("");
  const customerSearchRequest = useRef(0);
  const [form, setForm] = useState({
    hostOne: "",
    hostTwo: "",
    eventDate: "",
    eventTime: "",
    googleMapsUrl: "",
    address: "",
    message: "",
  });
  const [hostImage, setHostImage] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [hostPreview, setHostPreview] = useState("");
  const [invitationPreview, setInvitationPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const hostImageInput = useRef(null);
  const invitationInput = useRef(null);

  useEffect(() => {
    if (!customerSearchOpen) return undefined;

    const requestId = ++customerSearchRequest.current;
    const timeoutId = setTimeout(async () => {
      setCustomerLoading(true);
      setCustomerSearchError("");
      try {
        const response = await getUsersApi({
          page: 1,
          limit: 10,
          role: "customer",
          status: "Active",
          search: customerSearch.trim(),
        });
        if (requestId === customerSearchRequest.current) {
          setCustomerResults(
            (response.data?.users || []).filter((user) => user.isEnabled !== false)
          );
        }
      } catch (requestError) {
        if (requestId === customerSearchRequest.current) {
          setCustomerSearchError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Unable to load customers."
          );
        }
      } finally {
        if (requestId === customerSearchRequest.current) {
          setCustomerLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [customerSearch, customerSearchOpen]);

  useEffect(() => {
    if (!hostImage) {
      setHostPreview("");
      return undefined;
    }
    const preview = URL.createObjectURL(hostImage);
    setHostPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [hostImage]);

  useEffect(() => {
    if (!invitation) {
      setInvitationPreview("");
      return undefined;
    }
    const preview = URL.createObjectURL(invitation);
    setInvitationPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [invitation]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!eventType?._id) {
      setError("The selected event type is missing. Return to the event list and try again.");
      return;
    }
    if (!selectedCustomer?._id) {
      setError("Select a customer for this event.");
      return;
    }
    if (!form.hostOne.trim() || (eventName !== "Birthday" && !form.hostTwo.trim())) {
      setError(eventName === "Birthday"
        ? `Please enter ${config.firstHostLabel.toLowerCase()}.`
        : `Please enter both ${config.firstHostLabel.toLowerCase()} and ${config.secondHostLabel.toLowerCase()}.`);
      return;
    }
    if (
      !form.eventDate ||
      !form.eventTime ||
      !form.googleMapsUrl.trim() ||
      !form.address.trim()
    ) {
      setError("Event date, time, Google Maps location, and address are required.");
      return;
    }
    if (!isValidMapUrl(form.googleMapsUrl)) {
      setError("Enter a valid Google Maps URL starting with http:// or https://.");
      return;
    }
    if (!hostImage) {
      setError(`Please upload the ${config.imageLabel.toLowerCase()}.`);
      return;
    }
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(hostImage.type) &&
        !/\.(jpe?g|png|webp)$/i.test(hostImage.name)) {
      setError("Photo must be a JPG, JPEG, PNG, or WEBP image.");
      return;
    }
    if (hostImage.size > 5 * 1024 * 1024) {
      setError("Photo must be 5 MB or smaller.");
      return;
    }
    if (invitation) {
      const isPdf = invitation.type === "application/pdf" || /\.pdf$/i.test(invitation.name);
      const isImage = /^image\/(jpeg|jpg|png|webp)$/.test(invitation.type) ||
        /\.(jpe?g|png|webp)$/i.test(invitation.name);
      if (!isPdf && !isImage) {
        setError("Invitation must be a JPG, JPEG, PNG, WEBP image, or PDF.");
        return;
      }
      if (invitation.size > (isPdf ? 10 : 5) * 1024 * 1024) {
        setError(`Invitation ${isPdf ? "PDF" : "image"} exceeds the allowed file size.`);
        return;
      }
    }

    const payload = new FormData();
    payload.append("customerId", selectedCustomer._id);
    payload.append("eventTypeId", eventType._id);
    payload.append("title", config.title(form.hostOne.trim(), form.hostTwo.trim()));
    payload.append("hostOne", form.hostOne.trim());
    payload.append("hostTwo", eventName === "Birthday" ? "" : form.hostTwo.trim());
    payload.append("eventDate", form.eventDate);
    payload.append("eventTime", form.eventTime);
    payload.append("address", form.address.trim());
    payload.append("location", JSON.stringify({
      address: "",
      latitude: null,
      longitude: null,
      googleMapsUrl: form.googleMapsUrl.trim(),
    }));
    payload.append("message", form.message.trim());
    payload.append("status", "Draft");
    payload.append("isPublished", "false");
    payload.append("hostOneImage", hostImage);
    if (invitation) payload.append("invitation", invitation);

    setSaving(true);
    try {
      const response = await createAdminEventApi(payload);
      await onCreated(response.message || `${eventName} event created successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Failed to create event.");
    } finally {
      setSaving(false);
    }
  };

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Registration is not available for this event type.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Back to Events</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTextField = (key, label, placeholder, options = {}) => (
    <View
      style={[
        styles.field,
        options.column && styles.columnField,
        (options.fullWidth || options.multiline) && styles.fullWidthField,
      ]}
      key={key}
    >
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, options.multiline && styles.multilineInput]}
        value={form[key]}
        onChangeText={(value) => updateField(key, value)}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={options.multiline || false}
        numberOfLines={options.multiline ? 3 : 1}
        textAlignVertical={options.multiline ? "top" : "center"}
        keyboardType={options.keyboardType || "default"}
        autoCapitalize={options.autoCapitalize || "sentences"}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onCancel}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Back to events"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#4F46E5" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Register {eventName}</Text>
          <Text style={styles.subtitle}>Enter the event details to create a draft.</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Customer <Text style={styles.requiredMarker}>*</Text>
          </Text>
          <Text style={styles.customerDescription}>
            Search for the customer who will own this event.
          </Text>
          <View style={styles.customerPicker}>
            <View style={styles.customerSearchInput}>
              <MaterialCommunityIcons name="account-search-outline" size={19} color="#64748B" />
              <TextInput
                style={styles.customerSearchText}
                value={customerSearch}
                onFocus={() => {
                  if (selectedCustomer) {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }
                  setCustomerSearchOpen(true);
                }}
                onChangeText={(value) => {
                  setCustomerSearch(value);
                  setSelectedCustomer(null);
                  setCustomerSearchOpen(true);
                }}
                placeholder="Search customer by name, email, or phone"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Search customers"
                accessibilityHint="Required. Select the customer who will own this event."
                accessibilityHint="Required. Select the customer who will own this event."
              />
              {selectedCustomer ? (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                    setCustomerSearchOpen(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear selected customer"
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              )}
            </View>
            {customerSearchOpen ? (
              <View style={styles.customerDropdown}>
                {customerLoading ? (
                  <View style={styles.customerDropdownMessage}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.customerDropdownMessageText}>Searching customers...</Text>
                  </View>
                ) : customerSearchError ? (
                  <Text style={[styles.customerDropdownMessageText, styles.customerSearchError]}>
                    {customerSearchError}
                  </Text>
                ) : customerResults.length === 0 ? (
                  <Text style={styles.customerDropdownMessageText}>
                    No active customers found.
                  </Text>
                ) : (
                  <ScrollView
                    style={styles.customerOptions}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    {customerResults.map((customer) => {
                      const customerName = [customer.firstName, customer.lastName]
                        .filter(Boolean)
                        .join(" ");
                      return (
                        <TouchableOpacity
                          key={customer._id}
                          style={styles.customerOption}
                          onPress={() => {
                            setSelectedCustomer(customer);
                            setCustomerSearch(`${customerName} · ${customer.email || customer.phone}`);
                            setCustomerSearchOpen(false);
                            setError("");
                          }}
                          accessibilityRole="button"
                        >
                          <Text style={styles.customerOptionName}>{customerName}</Text>
                          <Text style={styles.customerOptionDetails}>
                            {[customer.email, customer.phone].filter(Boolean).join(" · ")}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ) : null}
          </View>
          {selectedCustomer ? (
            <Text style={styles.selectedCustomerHint}>
              This event will be added to {selectedCustomer.firstName} {selectedCustomer.lastName}&apos;s account.
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event hosts</Text>
          <View style={styles.twoColumn}>
            {renderTextField("hostOne", config.firstHostLabel, `Enter ${config.firstHostLabel.toLowerCase()}`, { column: true })}
            {eventName !== "Birthday"
              ? renderTextField("hostTwo", config.secondHostLabel, `Enter ${config.secondHostLabel.toLowerCase()}`, { column: true })
              : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date and time</Text>
          <View style={styles.twoColumn}>
            <View style={[styles.field, styles.columnField]}>
              <Text style={styles.label}>{eventName} date</Text>
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
                style={styles.webInput}
              />
            </View>
            <View style={[styles.field, styles.columnField]}>
              <Text style={styles.label}>{eventName} time</Text>
              <input
                type="time"
                value={form.eventTime}
                onChange={(event) => updateField("eventTime", event.target.value)}
                style={styles.webInput}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {renderTextField(
            "googleMapsUrl",
            "Event location (Google Maps URL)",
            "Paste Google Maps URL",
            { autoCapitalize: "none", keyboardType: "url", fullWidth: true }
          )}
          {renderTextField("address", `${eventName} address / venue`, "Enter venue and full address", { multiline: true })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invitation</Text>
          {renderTextField("message", "Invitation message (optional)", "Write a message for your guests", { multiline: true })}

          <View style={[styles.field, styles.uploadField]}>
            <Text style={styles.label}>{config.imageLabel}</Text>
            <input
              ref={hostImageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={styles.hiddenInput}
              onChange={(event) => setHostImage(event.target.files?.[0] || null)}
            />
            <View style={styles.fileRow}>
              <TouchableOpacity style={styles.fileButton} onPress={() => hostImageInput.current?.click()}>
                <MaterialCommunityIcons name="image-outline" size={18} color="#4F46E5" />
                <Text style={styles.fileButtonText}>Choose photo</Text>
              </TouchableOpacity>
              <Text style={styles.fileName} numberOfLines={1}>{hostImage?.name || "No photo selected"}</Text>
            </View>
            {hostPreview ? <img src={hostPreview} alt={config.imageLabel} style={styles.photoPreview} /> : null}
          </View>

          <View style={[styles.field, styles.uploadField]}>
            <Text style={styles.label}>Invitation image or PDF</Text>
            <input
              ref={invitationInput}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              style={styles.hiddenInput}
              onChange={(event) => setInvitation(event.target.files?.[0] || null)}
            />
            <View style={styles.fileRow}>
              <TouchableOpacity style={styles.fileButton} onPress={() => invitationInput.current?.click()}>
                <MaterialCommunityIcons name="file-image-outline" size={18} color="#4F46E5" />
                <Text style={styles.fileButtonText}>Choose invitation</Text>
              </TouchableOpacity>
              <Text style={styles.fileName} numberOfLines={1}>{invitation?.name || "No invitation selected"}</Text>
            </View>
            {invitationPreview ? (
              isInvitationPdf(invitation) ? (
                <iframe title="Invitation PDF preview" src={invitationPreview} style={styles.pdfPreview} />
              ) : (
                <img src={invitationPreview} alt="Invitation preview" style={styles.imagePreview} />
              )
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onCancel} disabled={saving}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
            <Text style={styles.submitButtonText}>{saving ? "Creating..." : `Create ${eventName}`}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const isInvitationPdf = (file) => file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");

const isValidMapUrl = (value) => {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    maxWidth: 960,
    width: "100%",
    boxSizing: "border-box",
    alignSelf: "center",
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 14,
  },
  error: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    color: "#B91C1C",
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  section: {
    width: "100%",
    minWidth: 0,
    flexShrink: 0,
    boxSizing: "border-box",
    gap: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "700",
  },
  requiredMarker: {
    color: "#DC2626",
  },
  customerDescription: {
    color: "#64748B",
    fontSize: 13,
    marginTop: -8,
  },
  customerPicker: {
    position: "relative",
    zIndex: 2,
  },
  customerSearchInput: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  customerSearchText: {
    flex: 1,
    minWidth: 0,
    height: 42,
    padding: 0,
    color: "#0F172A",
    fontSize: 14,
    outlineStyle: "none",
  },
  customerDropdown: {
    marginTop: 4,
    maxHeight: 220,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerOptions: {
    maxHeight: 220,
  },
  customerDropdownMessage: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
  },
  customerDropdownMessageText: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: "#64748B",
    fontSize: 13,
  },
  customerSearchError: {
    color: "#B91C1C",
  },
  customerOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  customerOptionName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  customerOptionDetails: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
  },
  selectedCustomerHint: {
    color: "#4338CA",
    fontSize: 12,
  },
  twoColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 14,
  },
  field: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    flexShrink: 0,
    gap: 6,
  },
  uploadField: {
    marginTop: 8,
  },
  columnField: {
    flex: 1,
    minWidth: 230,
  },
  fullWidthField: {
    width: "100%",
    minWidth: 0,
    flexGrow: 0,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    minHeight: 42,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 7,
    color: "#0F172A",
    fontSize: 14,
    outlineStyle: "none",
  },
  multilineInput: {
    height: 88,
    minHeight: 88,
    paddingTop: 10,
    paddingBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  webInput: {
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
  hiddenInput: {
    display: "none",
  },
  fileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  fileButton: {
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
  fileButtonText: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "600",
  },
  fileName: {
    flexShrink: 1,
    color: "#64748B",
    fontSize: 12,
  },
  photoPreview: {
    width: "100%",
    maxHeight: 260,
    aspectRatio: 16 / 9,
    objectFit: "contain",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  imagePreview: {
    width: "100%",
    maxHeight: 300,
    objectFit: "contain",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  pdfPreview: {
    width: "100%",
    height: 340,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingVertical: 6,
  },
  secondaryButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default EventRegistrationForm;
