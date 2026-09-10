import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ImageBackground,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { getMyEvents } from "../api/event.api";
import { getUser } from "../../../utils/auth";

export default function MyEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  // --------------------------------------------------
  // EVENT TYPE IMAGES
  // --------------------------------------------------

  const allowedEvents = [
    {
      name: "Wedding",
      image: require("../../../../assets/images/wedding.png"),
    },
    {
      name: "Anniversary",
      image: require("../../../../assets/images/anniversary.png"),
    },
    {
      name: "Engagement",
      image: require("../../../../assets/images/engagement.png"),
    },
    {
      name: "Birthday",
      image: require("../../../../assets/images/birthday.png"),
    },
  ];

  // --------------------------------------------------
  // LOAD EVENTS
  // --------------------------------------------------

  const loadEvents = async () => {
    try {
      const user = await getUser();

      console.log("Logged in user:", user);

      if (!user?.id) {
        console.log("User ID not found");
        setEvents([]);
        return;
      }

      console.log("Loading events for user:", user.id);

      const response = await getMyEvents(user.id);

      console.log("My events response:", response);

      setEvents(response?.data || []);
    } catch (error) {
      console.log(
        "Load my events error:",
        error.response?.data || error
      );

      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
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
      return date;
    }
  };

  // --------------------------------------------------
  // GET EVENT TYPE IMAGE
  // --------------------------------------------------

  const getEventTypeImage = (item) => {
    const eventTypeName = item?.eventTypeId?.name;

    if (!eventTypeName) {
      return null;
    }

    const eventType = allowedEvents.find(
      (event) =>
        event.name.toLowerCase() ===
        eventTypeName.toLowerCase()
    );

    return eventType?.image || null;
  };

  // --------------------------------------------------
  // GET USER UPLOADED IMAGE
  // --------------------------------------------------

  const getEventImage = (item) => {
    if (item?.hostOneImage) {
      return item.hostOneImage;
    }

    // if (item?.hostTwoImage) {
    //   return item.hostTwoImage;
    // }

    return null;
  };

  // --------------------------------------------------
  // PAGE HEADER (always pinned to top)
  // --------------------------------------------------

  const renderPageHeader = () => (
    <View
      style={styles.pageHeader}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;

        if (height && height !== headerHeight) {
          setHeaderHeight(height);
        }
      }}
    >
      <TouchableOpacity
        style={styles.pageBackButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={22}
          color="#263957"
        />

        <Text style={styles.pageTitle}>
          My Events
        </Text>
      </TouchableOpacity>

      {events.length > 0 ? (
        <Text style={styles.pageSubtitle}>
          {events.length}{" "}
          {events.length === 1 ? "event" : "events"}{" "}
          created
        </Text>
      ) : null}
    </View>
  );

  // --------------------------------------------------
  // RENDER EVENT
  // --------------------------------------------------

  const renderEvent = ({ item }) => {
    const eventImage = getEventImage(item);
    const eventTypeImage = getEventTypeImage(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          console.log("Selected event:", item);

          // Later:
          navigation.navigate("EventDeScreen", {
            event: item,
          });
        }}
      >
        {/* CARD TOP */}

        <View style={styles.cardTop}>
          {/* EVENT IMAGE */}

          {eventImage ? (
            <Image
              source={{
                uri: eventImage,
              }}
              style={styles.eventImage}
            />
          ) : eventTypeImage ? (
            <Image
              source={eventTypeImage}
              style={styles.eventImage}
            />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <Ionicons
                name="calendar-outline"
                size={30}
                color="#ff7f86"
              />
            </View>
          )}

          {/* TITLE + META */}

          <View style={styles.titleContainer}>
            <Text
              style={styles.eventTitle}
              numberOfLines={2}
            >
              {item.title || "Untitled Event"}
            </Text>

            {/* EVENT TYPE + STATUS */}

            <View style={styles.eventMetaRow}>
              <Text style={styles.eventTypeText}>
                {item.eventTypeId?.name || "Event"}
              </Text>

              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  {item.status || "Draft"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* DIVIDER */}

        <View style={styles.divider} />

        {/* DATE */}

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color="#ff7f86"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              Date
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(item.eventDate)}
            </Text>
          </View>
        </View>

        {/* TIME */}

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color="#ff7f86"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              Time
            </Text>

            <Text style={styles.infoValue}>
              {item.eventTime || "-"}
            </Text>
          </View>
        </View>

        {/* HOSTS */}

        <View style={styles.hostContainer}>
          <Ionicons
            name="people-outline"
            size={19}
            color="#ff7f86"
          />

          <Text
            style={styles.hostText}
            numberOfLines={1}
          >
            {item.hostOne || "-"}
            {item.hostTwo
              ? ` & ${item.hostTwo}`
              : ""}
          </Text>
        </View>

        {/* ADDRESS REMOVED */}
      </TouchableOpacity>
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require("../../../../assets/Vector1.png")}
          style={styles.backgroundFixed}
          resizeMode="cover"
        />

        {renderPageHeader()}

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#ff7f86"
          />

          <Text style={styles.loadingText}>
            Loading your events...
          </Text>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // MAIN
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../../assets/Vector1.png")}
        style={styles.backgroundFixed}
        resizeMode="cover"
      />

      {/* HEADER — pinned to top for both empty & non-empty states */}
      {renderPageHeader()}

      <FlatList
        style={styles.list}
        data={events}
        keyExtractor={(item, index) =>
          item?._id || String(index)
        }
        renderItem={renderEvent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ff7f86"
            colors={["#ff7f86"]}
          />
        }
        contentContainerStyle={[
          events.length === 0
            ? styles.emptyContainer
            : styles.listContainer,
          { paddingTop: headerHeight },
        ]}
        showsVerticalScrollIndicator={false}

        // --------------------------------------------------
        // EMPTY
        // --------------------------------------------------

        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="calendar-outline"
                size={45}
                color="#ff7f86"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Events Yet
            </Text>

            <Text style={styles.emptyText}>
              Your created events will appear here.
            </Text>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() =>
                navigation.navigate("Events", {
                  screen: "EventTypes",
                })
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={21}
                color="#ffffff"
              />

              <Text style={styles.createButtonText}>
                Create Event
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#ffffff",
  },

  backgroundFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // --------------------------------------------------
  // PAGE HEADER (always pinned to top of the screen)
  // --------------------------------------------------

  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
  },

  list: {
    flex: 1,
  },

  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },

  pageBackButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#263957",
    marginLeft: 4,
  },

  pageSubtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
    marginLeft: 26,
  },

  // --------------------------------------------------
  // CARD
  // --------------------------------------------------

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  eventImage: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
  },

  eventImagePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  titleContainer: {
    flex: 1,
    marginLeft: 13,
  },

  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#263957",
    lineHeight: 22,
  },

  // --------------------------------------------------
  // EVENT TYPE + STATUS
  // --------------------------------------------------

  eventMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  eventTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ff7f86",
  },

  statusContainer: {
    backgroundColor: "#fff1f2",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 8,
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
    marginVertical: 14,
  },

  // --------------------------------------------------
  // INFO
  // --------------------------------------------------

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoLabel: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 13,
    color: "#444444",
    fontWeight: "500",
  },

  // --------------------------------------------------
  // HOST
  // --------------------------------------------------

  hostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },

  hostText: {
    flex: 1,
    fontSize: 14,
    color: "#263957",
    fontWeight: "600",
    marginLeft: 8,
  },

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#777777",
  },

  // --------------------------------------------------
  // EMPTY
  // --------------------------------------------------

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyBox: {
    alignItems: "center",
    padding: 30,
  },

  emptyIcon: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#263957",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
  },

  createButton: {
    height: 50,
    backgroundColor: "#ff7f86",
    borderRadius: 12,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});