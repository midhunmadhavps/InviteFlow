import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { getScheduleInvites } from "../api/event.api";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function ScheduleInvitesScreen({ navigation, route }) {
  const { colors, isDark } = useAppTheme();
  const event = route.params?.event;
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await getScheduleInvites(event?._id);
      setSchedules(response?.data || []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [event?._id]);

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules])
  );

  const formatDateTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }
    return `${date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const renderSchedule = ({ item }) => (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleIcon}>
        <Ionicons name="mail-outline" size={22} color="#ff7f86" />
      </View>
      <View style={styles.scheduleDetails}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {item.eventId?.title || "Event"}
        </Text>
        <Text style={styles.contactName} numberOfLines={1}>
          To: {item.contactId?.name || "Contact"}
          {item.contactId?.phoneNumber ? ` (${item.contactId.phoneNumber})` : ""}
        </Text>
        <Text style={styles.scheduleDate}>
          Scheduled: {formatDateTime(item.scheduledAt)}
        </Text>
        {item.eventId?.eventDate ? (
          <Text style={styles.scheduleDate}>
            Event date: {new Date(item.eventId.eventDate).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
    </View>
  );

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
              <Text style={styles.headerTitle}>Scheduled Invites</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {event?.title || "All events"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                navigation.navigate("ScheduleInviteCreate", { event })
              }
              accessibilityLabel="Schedule an invite"
            >
              <Ionicons name="add" size={25} color="#ff7f86" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() =>
                navigation.navigate("ScheduleInviteCreate", { event })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={19} color="#ffffff" />
              <Text style={styles.createButtonText}>Schedule Invite</Text>
            </TouchableOpacity>

            {loading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color="#ff7f86" />
                <Text style={styles.stateText}>Loading scheduled invites...</Text>
              </View>
            ) : loadError ? (
              <View style={styles.stateContainer}>
                <Text style={styles.stateText}>Could not load scheduled invites.</Text>
                <TouchableOpacity onPress={loadSchedules}>
                  <Text style={styles.retryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : schedules.length === 0 ? (
              <View style={styles.stateContainer}>
                <Ionicons name="calendar-outline" size={48} color="#c5c9d0" />
                <Text style={styles.stateText}>No invites scheduled yet.</Text>
              </View>
            ) : (
              <FlatList
                data={schedules}
                keyExtractor={(item) => item._id}
                renderItem={renderSchedule}
                contentContainerStyle={styles.scheduleList}
                showsVerticalScrollIndicator={false}
              />
            )}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#ff7f86",
  },
  backButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    maxWidth: "90%",
    marginTop: 2,
    color: "#ffffff",
    fontSize: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    borderRadius: 11,
    backgroundColor: "#ff7f86",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  scheduleList: {
    paddingBottom: 20,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6e8ed",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  scheduleIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderRadius: 21,
    backgroundColor: "#fff0f1",
  },
  scheduleDetails: {
    flex: 1,
  },
  eventTitle: {
    color: "#263957",
    fontSize: 15,
    fontWeight: "700",
  },
  contactName: {
    marginTop: 4,
    color: "#535e70",
    fontSize: 13,
  },
  scheduleDate: {
    marginTop: 5,
    color: "#777f8b",
    fontSize: 12,
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: {
    color: "#777f8b",
    fontSize: 14,
    textAlign: "center",
  },
  retryText: {
    color: "#ff7f86",
    fontWeight: "700",
  },
});
