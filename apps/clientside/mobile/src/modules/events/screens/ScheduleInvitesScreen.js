import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ImageBackground,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import {
  getScheduleInvites,
  deleteScheduleInvite,
  updateScheduleInviteStatus,
} from "../api/event.api";
import { ThemeTree, useAppTheme } from "../../../../../web/src/shared/theme/ThemeContext";

export default function ScheduleInvitesScreen({ navigation, route }) {
  const { colors, isDark } = useAppTheme();
  const event = route.params?.event;
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updatingScheduleId, setUpdatingScheduleId] = useState(null);
  const [createButtonWidth, setCreateButtonWidth] = useState(0);
  const shineProgress = useRef(new Animated.Value(0)).current;
  const shineTranslateX = shineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-70, createButtonWidth + 70],
  });

  useEffect(() => {
    if (!createButtonWidth) {
      return undefined;
    }

    const shineAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(shineProgress, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    shineAnimation.start();

    return () => shineAnimation.stop();
  }, [createButtonWidth, shineProgress]);

  const showActionError = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

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

  const toggleInviteStatus = async (item) => {
    const nextIsComplete = !item.is_complete;
    setUpdatingScheduleId(item._id);
    try {
      await updateScheduleInviteStatus(item._id, nextIsComplete);
      setSchedules((current) =>
        current.map((schedule) =>
          schedule._id === item._id
            ? { ...schedule, is_complete: nextIsComplete }
            : schedule
        )
      );
    } catch (error) {
      showActionError(
        "Could not update status",
        error.response?.data?.message || "Please try again."
      );
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  const deletePendingInvite = async (item) => {
    setUpdatingScheduleId(item._id);
    try {
      await deleteScheduleInvite(item._id);
      setSchedules((current) =>
        current.filter((schedule) => schedule._id !== item._id)
      );
    } catch (error) {
      showActionError(
        "Could not delete invite",
        error.response?.data?.message || "Please try again."
      );
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  const confirmDeleteInvite = (item) => {
    if (Platform.OS === "web") {
      if (window.confirm("Delete this pending scheduled invite?")) {
        deletePendingInvite(item);
      }
      return;
    }

    Alert.alert(
      "Delete scheduled invite?",
      "This pending invite will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePendingInvite(item),
        },
      ]
    );
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
      <View style={styles.scheduleActions}>
        <TouchableOpacity
          style={[
            styles.statusBadge,
            item.is_complete ? styles.sentBadge : styles.pendingBadge,
          ]}
          onPress={() => toggleInviteStatus(item)}
          disabled={updatingScheduleId === item._id}
          accessibilityLabel={
            item.is_complete ? "Mark invite as pending" : "Mark invite as sent"
          }
        >
          {updatingScheduleId === item._id ? (
            <ActivityIndicator
              size="small"
              color={item.is_complete ? "#1f7a3d" : "#8a6500"}
            />
          ) : (
            <Text
              style={[
                styles.statusText,
                item.is_complete ? styles.sentText : styles.pendingText,
              ]}
            >
              {item.is_complete ? "Sent" : "Pending"}
            </Text>
          )}
        </TouchableOpacity>
        {!item.is_complete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDeleteInvite(item)}
            disabled={updatingScheduleId === item._id}
            accessibilityLabel="Delete pending scheduled invite"
          >
            <Ionicons name="trash-outline" size={19} color="#d64545" />
          </TouchableOpacity>
        )}
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
            <View style={styles.headerActionSpacer} />
          </View>

          <View style={styles.content}>
            <TouchableOpacity
              style={styles.createButton}
              onLayout={(layoutEvent) =>
                setCreateButtonWidth(layoutEvent.nativeEvent.layout.width)
              }
              onPress={() =>
                navigation.navigate("ScheduleInviteCreate", { event })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={19} color="#ff7f86" />
              <Text style={styles.createButtonText}>Schedule Invite</Text>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.buttonShine,
                  {
                    transform: [
                      { translateX: shineTranslateX },
                      { skewX: "-20deg" },
                    ],
                  },
                ]}
              />
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
  headerActionSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  createButton: {
    position: "relative",
    overflow: "hidden",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
    borderRadius: 11,
    backgroundColor: "#ffffff",
  },
  buttonShine: {
    position: "absolute",
    top: -12,
    bottom: -12,
    width: 42,
    backgroundColor: "rgba(255,127,134,0.2)",
  },
  createButtonText: {
    color: "#ff7f86",
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
  scheduleActions: {
    alignItems: "center",
    gap: 8,
    marginLeft: 8,
  },
  statusBadge: {
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  deleteButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#fff0f0",
  },
  pendingBadge: {
    backgroundColor: "#fff1bd",
  },
  sentBadge: {
    backgroundColor: "#d8f3df",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pendingText: {
    color: "#8a6500",
  },
  sentText: {
    color: "#1f7a3d",
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
