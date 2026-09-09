import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    eventDate: "2026-09-09T00:00:00.000Z",
    eventTime: "20:37",
    address:
      "Poomkulath (H), Thekkumkara, Wadakkanchery",
    message:
      "We are happy to invite you to celebrate our special day with us.",
  };

  const eventData = event || dummyEvent;

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
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#263957"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Event Details
            </Text>

            <View style={styles.headerRight} />
          </View>

          {/* EVENT CARD */}

          <View style={styles.card}>
            {/* EVENT IMAGE */}

            <View style={styles.imageContainer}>
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="calendar-outline"
                  size={55}
                  color="#ff7f86"
                />
              </View>
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

            {/* HOSTS */}

            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color="#ff7f86"
                />
              </View>

              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  Hosts
                </Text>

                <Text style={styles.detailValue}>
                  {eventData.hostOne || "-"}
                  {eventData.hostTwo
                    ? ` & ${eventData.hostTwo}`
                    : ""}
                </Text>
              </View>
            </View>

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

          {/* DUMMY EDIT BUTTON */}

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.8}
            onPress={() => {
              console.log(
                "Edit event:",
                eventData
              );
            }}
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

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "700",
    color: "#263957",
  },

  headerRight: {
    width: 40,
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
  // IMAGE
  // --------------------------------------------------

  imageContainer: {
    alignItems: "center",
    marginBottom: 18,
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
    marginVertical: 20,
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
  // EDIT BUTTON
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