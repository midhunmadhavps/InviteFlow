import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

import { getContactsByUserId } from "../../contacts/api/contact.api";
import { getUser } from "../../../utils/auth";
import { useToast } from "../../../context/ToastContext";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";
import { scheduleInvites } from "../api/event.api";

export default function ScheduleInvitesScreen({ navigation, route }) {
  const { colors, isDark } = useAppTheme();
  const { showSuccess, showError } = useToast();
  const event = route.params?.event;
  const [contacts, setContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [scheduledAt, setScheduledAt] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const user = await getUser();
      const userId = user?.id || user?._id;
      if (!userId) {
        throw new Error("User information not found.");
      }

      const response = await getContactsByUserId(userId);
      setContacts(response?.data || []);
    } catch (error) {
      setLoadError(true);
      showError(error.response?.data?.message || error.message || "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const toggleContact = (contactId) => {
    setSelectedContactIds((selected) =>
      selected.includes(contactId)
        ? selected.filter((id) => id !== contactId)
        : [...selected, contactId]
    );
  };

  const updateDate = (event, date) => {
    if (date) {
      setScheduledAt((current) => {
        const next = new Date(current);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        return next;
      });
    }
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }
  };

  const updateTime = (event, time) => {
    if (time) {
      setScheduledAt((current) => {
        const next = new Date(current);
        next.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return next;
      });
    }
    if (Platform.OS !== "ios") {
      setShowTimePicker(false);
    }
  };

  const submitSchedule = async () => {
    if (!event?._id) {
      showError("Event information is missing.");
      return;
    }
    if (selectedContactIds.length === 0) {
      showError("Select at least one contact.");
      return;
    }

    setSaving(true);
    try {
      const response = await scheduleInvites({
        eventId: event._id,
        contactIds: selectedContactIds,
        scheduledAt: scheduledAt.toISOString(),
      });
      showSuccess(response.message || "Invites scheduled successfully.");
      navigation.goBack();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to schedule invites.");
    } finally {
      setSaving(false);
    }
  };

  const renderContact = ({ item }) => {
    const isSelected = selectedContactIds.includes(item._id);
    return (
      <TouchableOpacity
        style={[styles.contactCard, isSelected && styles.contactCardSelected]}
        onPress={() => toggleContact(item._id)}
        activeOpacity={0.75}
      >
        <View style={styles.contactIcon}>
          <Ionicons name="person-outline" size={21} color="#ff7f86" />
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {!!item.phoneNumber && (
            <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
          )}
        </View>
        <Ionicons
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={23}
          color={isSelected ? "#4CAF50" : "#aab0bb"}
        />
      </TouchableOpacity>
    );
  };

  const formatDate = (date) =>
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeTree>
        <ImageBackground
          source={isDark ? undefined : require("../../../../assets/Vector1.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={23} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Schedule Invits</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {event?.title || "Choose an event"}
              </Text>
            </View>
            <View style={styles.backButton} />
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Schedule date and time</Text>
            <View style={styles.pickerRow}>
              {Platform.OS === "web" ? (
                <View style={styles.pickerButton}>
                  <Ionicons name="calendar-outline" size={20} color="#ff7f86" />
                  <input
                    type="date"
                    value={`${scheduledAt.getFullYear()}-${String(scheduledAt.getMonth() + 1).padStart(2, "0")}-${String(scheduledAt.getDate()).padStart(2, "0")}`}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [year, month, day] = e.target.value.split("-").map(Number);
                      setScheduledAt((current) => {
                        const next = new Date(current);
                        next.setFullYear(year, month - 1, day);
                        return next;
                      });
                    }}
                    aria-label="Schedule date"
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#ff7f86" />
                  <Text style={styles.pickerText}>{formatDate(scheduledAt)}</Text>
                </TouchableOpacity>
              )}
              {Platform.OS === "web" ? (
                <View style={styles.pickerButton}>
                  <Ionicons name="time-outline" size={20} color="#ff7f86" />
                  <input
                    type="time"
                    lang="en-US"
                    value={`${String(scheduledAt.getHours()).padStart(2, "0")}:${String(scheduledAt.getMinutes()).padStart(2, "0")}`}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [hours, minutes] = e.target.value.split(":").map(Number);
                      setScheduledAt((current) => {
                        const next = new Date(current);
                        next.setHours(hours, minutes, 0, 0);
                        return next;
                      });
                    }}
                    aria-label="Schedule time"
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#ff7f86" />
                  <Text style={styles.pickerText}>{formatTime(scheduledAt)}</Text>
                </TouchableOpacity>
              )}
            </View>

            {Platform.OS !== "web" && showDatePicker && (
              <View style={styles.nativePicker}>
                <DateTimePicker
                  value={scheduledAt}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={updateDate}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {Platform.OS !== "web" && showTimePicker && (
              <View style={styles.nativePicker}>
                <DateTimePicker
                  value={scheduledAt}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  is24Hour={false}
                  locale="en-US"
                  onChange={updateTime}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.contactsHeader}>
              <Text style={styles.sectionTitle}>Select contacts</Text>
              <Text style={styles.selectedCount}>
                {selectedContactIds.length} selected
              </Text>
            </View>
            {loading ? (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#ff7f86" />
                <Text style={styles.statusText}>Loading contacts...</Text>
              </View>
            ) : loadError ? (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>Could not load contacts.</Text>
                <TouchableOpacity onPress={loadContacts}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : contacts.length === 0 ? (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>No saved contacts found.</Text>
              </View>
            ) : (
              <FlatList
                style={styles.contactsListContainer}
                data={contacts}
                keyExtractor={(item) => item._id}
                renderItem={renderContact}
                contentContainerStyle={styles.contactsList}
                showsVerticalScrollIndicator={false}
              />
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (saving || loading || contacts.length === 0) && styles.submitButtonDisabled,
              ]}
              onPress={submitSchedule}
              disabled={saving || loading || contacts.length === 0}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="calendar" size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Schedule Invits</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </ThemeTree>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    minHeight: 76,
    backgroundColor: "#ff7f86",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "700",
  },
  headerSubtitle: {
    maxWidth: "90%",
    color: "#ffffff",
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    color: "#263957",
    fontSize: 16,
    fontWeight: "700",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 18,
  },
  pickerButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6e8ed",
    borderRadius: 10,
  },
  pickerText: {
    flexShrink: 1,
    color: "#263957",
    fontSize: 13,
  },
  nativePicker: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 12,
    padding: 8,
  },
  doneText: {
    color: "#ff7f86",
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contactsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  selectedCount: {
    color: "#777f8b",
    fontSize: 13,
  },
  contactsList: {
    paddingBottom: 10,
  },
  contactsListContainer: {
    flex: 1,
  },
  contactCard: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e6e8ed",
    borderWidth: 1,
    borderRadius: 11,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  contactCardSelected: {
    borderColor: "#ff7f86",
    backgroundColor: "#fff8f8",
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff0f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: "#263957",
    fontSize: 14,
    fontWeight: "600",
  },
  contactPhone: {
    color: "#777f8b",
    fontSize: 12,
    marginTop: 3,
  },
  statusContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  statusText: {
    color: "#777f8b",
    fontSize: 14,
  },
  retryText: {
    color: "#ff7f86",
    fontWeight: "700",
  },
  submitButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ff7f86",
    borderRadius: 12,
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
