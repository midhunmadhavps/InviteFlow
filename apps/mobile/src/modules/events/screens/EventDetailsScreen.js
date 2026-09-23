import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateEvent } from "../api/event.api";
import { RequiredLabel, Label } from "../../../components/RequiredLabel";

// Event types that support two hosts (e.g. bride & groom, couple, partners)
const DUAL_HOST_EVENT_TYPES = ["Wedding", "Anniversary", "Engagement"];

export default function EventDetailsScreen({ navigation, route }) {
  const { event } = route.params || {};

  // Dummy event if no event was passed
  const dummyEvent = {
    title: "Midhun & Mredhula Wedding",
    eventTypeId: {
      name: "Wedding",
    },
    status: "Draft",
    hostOne: "Midhun",
    hostTwo: "Mredhula",
    hostOneImage:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80",
    eventDate: "2026-09-09",
    eventTime: "20:37",
    address: "Poomkulath (H), Thekkumkara, Wadakkanchery",
    location: {
      address: "Wadakkanchery, Thrissur",
    },
    message: "We are happy to invite you to celebrate our special day with us.",
  };

  const [eventData, setEventData] = useState(event || dummyEvent);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [editForm, setEditForm] = useState({
    title: (event || dummyEvent).title || "",
    hostOne: (event || dummyEvent).hostOne || "",
    hostTwo: (event || dummyEvent).hostTwo || "",
    eventDate: (event || dummyEvent).eventDate
      ? (event || dummyEvent).eventDate.split("T")[0]
      : "",
    eventTime: (event || dummyEvent).eventTime || "",
    address: (event || dummyEvent).address || "",
    message: (event || dummyEvent).message || "",
  });

  const [editLocation, setEditLocation] = useState({
    address:
      (event || dummyEvent).location?.address ||
      (typeof (event || dummyEvent).location === "string"
        ? (event || dummyEvent).location
        : "") ||
      "",
    latitude: (event || dummyEvent).location?.latitude || null,
    longitude: (event || dummyEvent).location?.longitude || null,
    googleMapsUrl: (event || dummyEvent).location?.googleMapsUrl || "",
  });

  const hostImage = eventData.hostOneImage || null;

  // --------------------------------------------------
  // CHECK IF CURRENT EVENT TYPE ALLOWS SECOND HOST
  // --------------------------------------------------

  const allowsSecondHost = () => {
    const typeName =
      eventData.eventTypeId?.name ||
      (typeof eventData.eventTypeId === "string"
        ? eventData.eventTypeId
        : "") ||
      "";

    return DUAL_HOST_EVENT_TYPES.some(
      (type) => type.toLowerCase() === typeName.toLowerCase().trim()
    );
  };

  // --------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return "-";
    }
  };

  // --------------------------------------------------
  // CONVERT URI TO FILE (FOR WEB)
  // --------------------------------------------------

  const uriToFile = async (uri, name, type) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new File([blob], name, {
      type: type || blob.type,
    });
  };

  // --------------------------------------------------
  // IMAGE PICKER
  // --------------------------------------------------

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  // --------------------------------------------------
  // DATE & TIME PICKER HANDLERS
  // --------------------------------------------------

  const handleDateChange = (e, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setEditForm((prev) => ({
        ...prev,
        eventDate: `${year}-${month}-${day}`,
      }));
    }
  };

  const handleTimeChange = (e, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = String(selectedTime.getHours()).padStart(2, "0");
      const minutes = String(selectedTime.getMinutes()).padStart(2, "0");
      setEditForm((prev) => ({
        ...prev,
        eventTime: `${hours}:${minutes}`,
      }));
    }
  };

  // --------------------------------------------------
  // EDIT HANDLERS
  // --------------------------------------------------

  const handleStartEdit = () => {
    setEditForm({
      title: eventData.title || "",
      hostOne: eventData.hostOne || "",
      hostTwo: eventData.hostTwo || "",
      eventDate: eventData.eventDate
        ? eventData.eventDate.split("T")[0]
        : "",
      eventTime: eventData.eventTime || "",
      address: eventData.address || "",
      message: eventData.message || "",
    });

    setEditLocation({
      address:
        eventData.location?.address ||
        (typeof eventData.location === "string"
          ? eventData.location
          : "") ||
        "",
      latitude: eventData.location?.latitude || null,
      longitude: eventData.location?.longitude || null,
      googleMapsUrl: eventData.location?.googleMapsUrl || "",
    });

    setSelectedImage(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) {
      Alert.alert("Validation", "Event title is required.");
      return;
    }

    if (!editForm.hostOne.trim()) {
      Alert.alert("Validation", "Host name is required.");
      return;
    }

    if (!editForm.eventDate.trim()) {
      Alert.alert("Validation", "Event date is required.");
      return;
    }

    setSaving(true);
    try {
      const eventId = eventData._id || eventData.eventId;
      let payload;

      const locationData = {
        address: editLocation.address || "",
        latitude: editLocation.latitude || null,
        longitude: editLocation.longitude || null,
        googleMapsUrl: editLocation.googleMapsUrl || "",
      };

      const finalHostTwo = allowsSecondHost() ? editForm.hostTwo || "" : "";

      if (selectedImage) {
        payload = new FormData();
        payload.append("title", editForm.title);
        payload.append("hostOne", editForm.hostOne);
        payload.append("hostTwo", finalHostTwo);
        payload.append("eventDate", editForm.eventDate);
        payload.append("eventTime", editForm.eventTime || "");
        payload.append("address", editForm.address || "");
        payload.append("location", JSON.stringify(locationData));
        payload.append("message", editForm.message || "");

        if (Platform.OS === "web") {
          const file = await uriToFile(
            selectedImage.uri,
            selectedImage.fileName || "host-photo.jpg",
            selectedImage.mimeType || "image/jpeg"
          );
          payload.append("hostOneImage", file);
        } else {
          payload.append("hostOneImage", {
            uri: selectedImage.uri,
            name: selectedImage.fileName || "host-photo.jpg",
            type: selectedImage.mimeType || "image/jpeg",
          });
        }
      } else {
        payload = {
          ...editForm,
          hostTwo: finalHostTwo,
          location: locationData,
        };
      }

      let updatedData = {
        ...eventData,
        ...editForm,
        hostTwo: finalHostTwo,
        location: locationData,
        ...(selectedImage?.uri ? { hostOneImage: selectedImage.uri } : {}),
      };

      if (eventId) {
        const response = await updateEvent(eventId, payload);
        if (response?.data) {
          updatedData = response.data;
        }
      }

      setEventData(updatedData);
      setIsEditing(false);
      setSelectedImage(null);
      Alert.alert("Success", "Event updated successfully!");
    } catch (error) {
      console.log("Update event error:", error);
      Alert.alert(
        "Update Failed",
        error.response?.data?.message ||
          error.message ||
          "Could not update event. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../../assets/Vector1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (isEditing) {
                  handleCancel();
                } else {
                  navigation.goBack();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#263957"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Event" : "Event Details"}
            </Text>

            <View style={styles.headerRight}>
              {!isEditing && (
                <TouchableOpacity
                  style={styles.headerEditBtn}
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color="#ff7f86"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ============================================== */}
          {/* EDIT MODE (INPUT SECTION)                      */}
          {/* ============================================== */}

          {isEditing ? (
            <View style={styles.card}>
              {/* EDIT IMAGE SECTION (Medium Image Preview) */}
              <View style={styles.imageEditContainer}>
                <TouchableOpacity
                  style={styles.mediumImageWrapper}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  {selectedImage?.uri ? (
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={styles.mediumPreviewImage}
                    />
                  ) : hostImage ? (
                    <Image
                      source={
                        typeof hostImage === "string"
                          ? { uri: hostImage }
                          : hostImage
                      }
                      style={styles.mediumPreviewImage}
                    />
                  ) : (
                    <View style={styles.mediumPlaceholder}>
                      <Ionicons
                        name="camera-outline"
                        size={32}
                        color="#ff7f86"
                      />
                      <Text style={styles.mediumPlaceholderText}>
                        Add Photo
                      </Text>
                    </View>
                  )}

                  <View style={styles.editCameraBadge}>
                    <Ionicons
                      name="camera"
                      size={14}
                      color="#ffffff"
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.changeImageButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="image-outline"
                    size={16}
                    color="#ff7f86"
                  />
                  <Text style={styles.changeImageText}>
                    {selectedImage || hostImage
                      ? "Change Host Photo"
                      : "Upload Host Photo"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* TITLE INPUT */}
              <RequiredLabel>Event Title</RequiredLabel>
              <TextInput
                style={styles.input}
                value={editForm.title}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, title: text }))
                }
                placeholder="Enter event title"
                placeholderTextColor="#999999"
              />

              {/* HOST ONE INPUT */}
              <RequiredLabel>
                {allowsSecondHost() ? "First Host Name" : "Host Name"}
              </RequiredLabel>
              <TextInput
                style={styles.input}
                value={editForm.hostOne}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, hostOne: text }))
                }
                placeholder={
                  allowsSecondHost()
                    ? "Enter first host name"
                    : "Enter host name"
                }
                placeholderTextColor="#999999"
              />

              {/* HOST TWO INPUT (Conditional for Wedding, Anniversary, Engagement) */}
              {allowsSecondHost() && (
                <>
                  <Label>Second Host Name</Label>
                  <TextInput
                    style={styles.input}
                    value={editForm.hostTwo}
                    onChangeText={(text) =>
                      setEditForm((prev) => ({ ...prev, hostTwo: text }))
                    }
                    placeholder="Enter second host / partner name"
                    placeholderTextColor="#999999"
                  />
                </>
              )}

              {/* EVENT DATE (Calendar like add form) */}
              <RequiredLabel>Event Date</RequiredLabel>
              {Platform.OS === "web" ? (
                <View style={styles.webInputWrapper}>
                  <input
                    type="date"
                    value={editForm.eventDate}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        eventDate: e.target.value,
                      }))
                    }
                    style={styles.webInput}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.inputButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text
                      style={
                        editForm.eventDate
                          ? styles.inputButtonText
                          : styles.placeholder
                      }
                    >
                      {editForm.eventDate || "Select event date"}
                    </Text>

                    <Ionicons
                      name="calendar-outline"
                      size={21}
                      color="#ff7f86"
                    />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={
                        editForm.eventDate
                          ? new Date(`${editForm.eventDate}T00:00:00`)
                          : new Date()
                      }
                      mode="date"
                      display={
                        Platform.OS === "ios" ? "spinner" : "default"
                      }
                      onChange={handleDateChange}
                    />
                  )}
                </>
              )}

              {/* EVENT TIME (Time picker like add form) */}
              <RequiredLabel>Event Time</RequiredLabel>
              {Platform.OS === "web" ? (
                <View style={styles.webInputWrapper}>
                  <input
                    type="time"
                    value={editForm.eventTime}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        eventTime: e.target.value,
                      }))
                    }
                    style={styles.webInput}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.inputButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text
                      style={
                        editForm.eventTime
                          ? styles.inputButtonText
                          : styles.placeholder
                      }
                    >
                      {editForm.eventTime || "Select event time"}
                    </Text>

                    <Ionicons
                      name="time-outline"
                      size={21}
                      color="#ff7f86"
                    />
                  </TouchableOpacity>

                  {showTimePicker && (
                    <DateTimePicker
                      value={new Date()}
                      mode="time"
                      display={
                        Platform.OS === "ios" ? "spinner" : "default"
                      }
                      onChange={handleTimeChange}
                    />
                  )}
                </>
              )}

              {/* EVENT LOCATION (Like add event page) */}
              <RequiredLabel>Event Location</RequiredLabel>
              <View style={styles.locationInput}>
                <Ionicons
                  name="location-outline"
                  size={21}
                  color="#ff7f86"
                />

                <TextInput
                  style={styles.locationTextInput}
                  placeholder="Enter event location"
                  placeholderTextColor="#999"
                  value={editLocation.address}
                  onChangeText={(text) =>
                    setEditLocation((prev) => ({
                      ...prev,
                      address: text,
                    }))
                  }
                />
              </View>

              {/* EVENT ADDRESS */}
              <Label>Event Address</Label>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter event address / venue"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={editForm.address}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, address: text }))
                }
              />

              {/* MESSAGE INPUT */}
              <Label>Message</Label>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.message}
                onChangeText={(text) =>
                  setEditForm((prev) => ({ ...prev, message: text }))
                }
                placeholder="Enter invitation message"
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* ACTION BUTTONS */}
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  activeOpacity={0.8}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Ionicons
                    name="close-outline"
                    size={18}
                    color="#555555"
                  />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.buttonDisabled]}
                  activeOpacity={0.8}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-outline"
                        size={18}
                        color="#ffffff"
                      />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ============================================== */
            /* VIEW MODE (EVENT CARD)                        */
            /* ============================================== */
            <>
              <View style={styles.card}>
                {/* EVENT IMAGE */}

                <View style={styles.imageContainer}>
                  {hostImage ? (
                    <Image
                      source={
                        typeof hostImage === "string"
                          ? { uri: hostImage }
                          : hostImage
                      }
                      style={styles.hostImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="person-outline"
                        size={48}
                        color="#ff7f86"
                      />
                    </View>
                  )}
                </View>

                {/* TITLE */}

                <Text style={styles.eventTitle}>
                  {eventData.title || "Untitled Event"}
                </Text>

                {/* EVENT TYPE + STATUS */}

                <View style={styles.metaRow}>
                  <Text style={styles.eventType}>
                    {eventData.eventTypeId?.name || "Event"}
                  </Text>

                  <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>
                      {eventData.status || "Draft"}
                    </Text>
                  </View>
                </View>

                {/* DIVIDER */}

                <View style={styles.divider} />

                {/* DATE */}

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#ff7f86"
                    />
                  </View>

                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>
                      Date
                    </Text>

                    <Text style={styles.detailValue}>
                      {formatDate(eventData.eventDate)}
                    </Text>
                  </View>
                </View>

                {/* TIME */}

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color="#ff7f86"
                    />
                  </View>

                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>
                      Time
                    </Text>

                    <Text style={styles.detailValue}>
                      {eventData.eventTime || "-"}
                    </Text>
                  </View>
                </View>

                {/* HOST / HOSTS */}

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={
                        allowsSecondHost() && eventData.hostTwo
                          ? "people-outline"
                          : "person-outline"
                      }
                      size={20}
                      color="#ff7f86"
                    />
                  </View>

                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>
                      {allowsSecondHost() && eventData.hostTwo
                        ? "Hosts"
                        : "Host"}
                    </Text>

                    <Text style={styles.detailValue}>
                      {eventData.hostOne || "-"}
                      {allowsSecondHost() && eventData.hostTwo
                        ? ` & ${eventData.hostTwo}`
                        : ""}
                    </Text>
                  </View>
                </View>

                {/* LOCATION */}

                {(eventData.location?.address ||
                  (typeof eventData.location === "string" &&
                    eventData.location)) && (
                  <View style={styles.detailRow}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="navigate-outline"
                        size={20}
                        color="#ff7f86"
                      />
                    </View>

                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>
                        Location
                      </Text>

                      <Text style={styles.detailValue}>
                        {eventData.location?.address ||
                          eventData.location}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ADDRESS */}

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#ff7f86"
                    />
                  </View>

                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>
                      Address
                    </Text>

                    <Text style={styles.detailValue}>
                      {eventData.address || "-"}
                    </Text>
                  </View>
                </View>

                {/* MESSAGE */}

                <View style={styles.messageContainer}>
                  <Text style={styles.detailLabel}>
                    Message
                  </Text>

                  <Text style={styles.messageText}>
                    {eventData.message || "No message added."}
                  </Text>
                </View>
              </View>

              {/* EDIT BUTTON */}

              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.8}
                onPress={handleStartEdit}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color="#ffffff"
                />

                <Text style={styles.editButtonText}>
                  Edit Event
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  background: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 5,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263957",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },

  headerRight: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  headerEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },

  // --------------------------------------------------
  // CARD
  // --------------------------------------------------

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },

  // --------------------------------------------------
  // IMAGE (VIEW MODE)
  // --------------------------------------------------

  imageContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  hostImage: {
    width: 250,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#fff1f2",
  },

  imagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 16,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  // --------------------------------------------------
  // IMAGE (EDIT MODE - MEDIUM IMAGE)
  // --------------------------------------------------

  imageEditContainer: {
    alignItems: "center",
    marginBottom: 16,
  },

  mediumImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#ffd1d5",
  },

  mediumPreviewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  mediumPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  mediumPlaceholderText: {
    fontSize: 12,
    color: "#ff7f86",
    fontWeight: "600",
    marginTop: 4,
  },

  editCameraBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ff7f86",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },

  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#fff1f2",
    borderRadius: 20,
    gap: 6,
  },

  changeImageText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ff7f86",
  },

  // --------------------------------------------------
  // TITLE
  // --------------------------------------------------

  eventTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#263957",
    textAlign: "center",
    lineHeight: 31,
  },

  // --------------------------------------------------
  // TYPE + STATUS
  // --------------------------------------------------

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  eventType: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ff7f86",
  },

  statusContainer: {
    backgroundColor: "#fff1f2",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 9,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ff7f86",
    textTransform: "capitalize",
  },

  divider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 18,
  },

  // --------------------------------------------------
  // DETAILS
  // --------------------------------------------------

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 17,
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  detailContent: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 2,
  },

  detailLabel: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 3,
  },

  detailValue: {
    fontSize: 14,
    color: "#263957",
    fontWeight: "600",
    lineHeight: 20,
  },

  // --------------------------------------------------
  // MESSAGE
  // --------------------------------------------------

  messageContainer: {
    marginTop: 4,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },

  messageText: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 21,
    marginTop: 5,
  },

  // --------------------------------------------------
  // INPUTS (EDIT MODE)
  // --------------------------------------------------

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#333333",
    backgroundColor: "#ffffff",
    marginBottom: 6,
  },

  multilineInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  textArea: {
    height: 85,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  inputButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    marginBottom: 6,
  },

  inputButtonText: {
    fontSize: 13,
    color: "#333333",
  },

  placeholder: {
    fontSize: 13,
    color: "#999999",
  },

  webInputWrapper: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginBottom: 6,
  },

  webInput: {
    width: "100%",
    height: 40,
    backgroundColor: "transparent",
    fontSize: 13,
    color: "#333333",
    borderWidth: 0,
    padding: 0,
  },

  locationInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    marginBottom: 6,
  },

  locationTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#333333",
  },

  // --------------------------------------------------
  // ACTION BUTTONS (EDIT MODE)
  // --------------------------------------------------

  actionButtonsRow: {
    flexDirection: "row",
    marginTop: 15,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  cancelButtonText: {
    color: "#555555",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  saveButton: {
    flex: 1.5,
    height: 48,
    backgroundColor: "#ff7f86",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  // --------------------------------------------------
  // EDIT BUTTON (VIEW MODE)
  // --------------------------------------------------

  editButton: {
    height: 50,
    backgroundColor: "#ff7f86",
    borderRadius: 12,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});