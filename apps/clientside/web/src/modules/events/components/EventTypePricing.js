import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Modal from "../../../components/Modal";
import { useAppTheme } from "../../../shared/theme/ThemeContext";
import {
  deleteAdminEventTypeApi,
  getAdminEventTypesApi,
  updateEventTypePriceApi,
} from "../api/event.api";

const EVENT_TYPE_IMAGES = {
  wedding: require("../../../../assets/images/wedding.png"),
  engagement: require("../../../../assets/images/engagement.png"),
  birthday: require("../../../../assets/images/birthday.png"),
  anniversary: require("../../../../assets/images/anniversary.png"),
};

const getEventTypeImage = (eventType) => {
  if (eventType.image) {
    const imageUrl = /^https?:\/\//i.test(eventType.image)
      ? eventType.image
      : `http://localhost:3000/uploads/${encodeURIComponent(eventType.image)}`;
    return { uri: imageUrl };
  }
  return EVENT_TYPE_IMAGES[eventType.name?.trim().toLowerCase()];
};

const EventTypePricing = ({ onEditEventType }) => {
  const { isDark } = useAppTheme();
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypePrices, setEventTypePrices] = useState({});
  const [savingEventTypeId, setSavingEventTypeId] = useState(null);
  const [eventTypeToDelete, setEventTypeToDelete] = useState(null);
  const [deletingEventTypeId, setDeletingEventTypeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    getAdminEventTypesApi()
      .then((response) => {
        if (!active) return;
        const types = response.data || [];
        setEventTypes(types);
        setEventTypePrices(
          Object.fromEntries(
            types.map((type) => [type._id, String(type.price ?? "")])
          )
        );
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load event type prices."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveEventTypePrice = async (eventType) => {
    const priceText = eventTypePrices[eventType._id]?.trim();
    const price = Number(priceText);
    if (
      !priceText ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(priceText)
    ) {
      setError(
        "Enter a valid event price greater than zero with up to two decimals."
      );
      setSuccess("");
      return;
    }

    setSavingEventTypeId(eventType._id);
    setError("");
    setSuccess("");
    try {
      const response = await updateEventTypePriceApi(eventType._id, price);
      setEventTypes((current) =>
        current.map((type) =>
          type._id === eventType._id
            ? { ...type, price: response.data.price }
            : type
        )
      );
      setEventTypePrices((current) => ({
        ...current,
        [eventType._id]: String(response.data.price),
      }));
      setSuccess(response.message || `${eventType.name} price saved.`);
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          saveError.message ||
          "Failed to save event type price."
      );
    } finally {
      setSavingEventTypeId(null);
    }
  };

  const deleteEventType = async () => {
    if (!eventTypeToDelete) return;

    const eventType = eventTypeToDelete;
    setDeletingEventTypeId(eventType._id);
    setError("");
    setSuccess("");
    try {
      const response = await deleteAdminEventTypeApi(eventType._id);
      setEventTypes((current) =>
        current.filter((type) => type._id !== eventType._id)
      );
      setEventTypePrices((current) => {
        const next = { ...current };
        delete next[eventType._id];
        return next;
      });
      setSuccess(response.message || `${eventType.name} removed from event types.`);
      setEventTypeToDelete(null);
    } catch (deleteError) {
      setError(
        deleteError.response?.data?.message ||
          deleteError.message ||
          "Failed to delete event type."
      );
      setEventTypeToDelete(null);
    } finally {
      setDeletingEventTypeId(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name="format-list-numbered"
            size={23}
            color="#047857"
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Event Type Pricing</Text>
          <Text style={styles.subtitle}>
            Set the Razorpay charge for each event type (INR)
          </Text>
        </View>
      </View>

      {error ? (
        <View style={[styles.message, styles.errorMessage]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {success ? (
        <View style={[styles.message, styles.successMessage]}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.table}>
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.typeColumn, styles.tableHeaderText]}>
            Event type
          </Text>
          <Text style={[styles.amountColumn, styles.tableHeaderText]}>
            Price (INR)
          </Text>
          <Text style={[styles.actionColumn, styles.tableHeaderText]}>
            Actions
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator style={styles.loader} color="#4F46E5" />
        ) : eventTypes.length ? (
          eventTypes.map((eventType) => (
            <View key={eventType._id} style={styles.row}>
              <View style={[styles.typeColumn, styles.typeCell]}>
                {getEventTypeImage(eventType) ? (
                  <Image
                    source={getEventTypeImage(eventType)}
                    style={styles.eventTypeImage}
                    resizeMode="contain"
                    accessibilityLabel={`${eventType.name} event image`}
                  />
                ) : (
                  <Text style={styles.eventTypeFallbackIcon}>
                    {eventType.icon || "✨"}
                  </Text>
                )}
                <Text style={styles.typeText} numberOfLines={2}>
                  {eventType.name}
                </Text>
              </View>
              <TextInput
                style={[styles.priceInput, styles.amountColumn]}
                value={eventTypePrices[eventType._id] ?? ""}
                onChangeText={(value) =>
                  setEventTypePrices((current) => ({
                    ...current,
                    [eventType._id]: value,
                  }))
                }
                placeholder="e.g. 499"
                keyboardType="decimal-pad"
                editable={savingEventTypeId !== eventType._id}
                accessibilityLabel={`${eventType.name} price in INR`}
              />
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (savingEventTypeId === eventType._id ||
                    deletingEventTypeId === eventType._id) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={() => saveEventTypePrice(eventType)}
                disabled={
                  savingEventTypeId === eventType._id ||
                  deletingEventTypeId === eventType._id
                }
                accessibilityRole="button"
                accessibilityLabel={`Save ${eventType.name} price`}
                activeOpacity={0.8}
              >
                {savingEventTypeId === eventType._id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => onEditEventType?.(eventType)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${eventType.name} event type`}
                activeOpacity={0.8}
                disabled={
                  savingEventTypeId === eventType._id ||
                  deletingEventTypeId === eventType._id
                }
              >
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color="#4338CA"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  (savingEventTypeId === eventType._id ||
                    deletingEventTypeId === eventType._id) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={() => setEventTypeToDelete(eventType)}
                disabled={
                  savingEventTypeId === eventType._id ||
                  deletingEventTypeId === eventType._id
                }
                accessibilityRole="button"
                accessibilityLabel={`Delete ${eventType.name} event type`}
                activeOpacity={0.8}
              >
                {deletingEventTypeId === eventType._id ? (
                  <ActivityIndicator size="small" color="#B91C1C" />
                ) : (
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={19}
                    color="#B91C1C"
                  />
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active event types are available.</Text>
        )}
      </View>
      <Modal
        visible={Boolean(eventTypeToDelete)}
        onClose={() => {
          if (!deletingEventTypeId) setEventTypeToDelete(null);
        }}
        title="Remove Event Type"
        confirmText="Delete"
        confirmColor="#DC2626"
        onConfirm={deleteEventType}
        isConfirming={Boolean(deletingEventTypeId)}
      >
        <Text style={[styles.deleteConfirmationText, isDark && styles.deleteConfirmationTextDark]}>
          Remove {eventTypeToDelete?.name} from event type options? Existing events
          using this type will keep their saved event type.
        </Text>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  icon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
  },
  message: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  errorMessage: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  successMessage: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
  },
  successText: {
    color: "#15803D",
    fontSize: 12,
  },
  table: {
    paddingTop: 16,
  },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableHeader: {
    minHeight: 34,
    paddingTop: 0,
    paddingBottom: 8,
  },
  typeColumn: {
    flex: 1,
  },
  amountColumn: {
    width: 120,
  },
  actionColumn: {
    width: 166,
  },
  tableHeaderText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  typeText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  typeCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  eventTypeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  eventTypeFallbackIcon: {
    width: 48,
    fontSize: 25,
    textAlign: "center",
  },
  priceInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 14,
  },
  saveButton: {
    width: 62,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButton: {
    width: 42,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
  },
  editButton: {
    width: 42,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  deleteConfirmationText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
  },
  deleteConfirmationTextDark: {
    color: "#E2E8F0",
  },
  loader: {
    marginVertical: 18,
  },
  emptyText: {
    paddingVertical: 12,
    color: "#64748B",
    fontSize: 13,
  },
});

export default EventTypePricing;
