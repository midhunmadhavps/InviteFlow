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
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { getMyEvents } from "../api/event.api";
import { getUser } from "../../../utils/auth";

export default function MyEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getEventImage = (item) => {
    if (item.hostOneImage) {
      return item.hostOneImage;
    }

    if (item.hostTwoImage) {
      return item.hostTwoImage;
    }

    return null;
  };

  const renderEvent = ({ item }) => {
    const eventImage = getEventImage(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          console.log("Selected event:", item);

          // You can navigate to event details later
          // navigation.navigate("EventDetails", {
          //   event: item,
          // });
        }}
      >
        <View style={styles.cardTop}>
          {eventImage ? (
            <Image
              source={{
                uri: eventImage,
              }}
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

          <View style={styles.titleContainer}>
            <Text
              style={styles.eventTitle}
              numberOfLines={2}
            >
              {item.title || "Untitled Event"}
            </Text>

            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                {item.status || "Draft"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

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

        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="location-outline"
              size={18}
              color="#ff7f86"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              Address
            </Text>

            <Text
              style={styles.infoValue}
              numberOfLines={2}
            >
              {item.address || "-"}
            </Text>
          </View>
        </View>

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
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Events
          </Text>

          <View style={styles.headerRight} />
        </View>

        <ImageBackground
          source={require("../../../../assets/Vector1.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#ff7f86"
            />

            <Text style={styles.loadingText}>
              Loading your events...
            </Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          My Events
        </Text>

        <View style={styles.headerRight} />
      </View>

      {/* BACKGROUND */}

      <ImageBackground
        source={require("../../../../assets/Vector1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <FlatList
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
          contentContainerStyle={
            events.length === 0
              ? styles.emptyContainer
              : styles.listContainer
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            events.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.pageTitle}>
                  My Events
                </Text>

                <Text style={styles.pageSubtitle}>
                  {events.length}{" "}
                  {events.length === 1
                    ? "event"
                    : "events"}{" "}
                  created
                </Text>
              </View>
            ) : null
          }
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
                  navigation.navigate("EventType")
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={21}
                  color="#ffffff"
                />

                <Text
                  style={styles.createButtonText}
                >
                  Create Event
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    height: 75,
    backgroundColor: "#ff7f86",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },

  headerRight: {
    width: 40,
  },

  background: {
    flex: 1,
  },

  listContainer: {
    padding: 20,
    paddingBottom: 50,
  },

  listHeader: {
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#263957",
  },

  pageSubtitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
  },

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

  statusContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#fff1f2",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ff7f86",
  },

  divider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 14,
  },

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

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
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