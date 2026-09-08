import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UpComingevents = [
  {
    id: "1",
    title: "Birthday Party",
    date: "12 Sep 2026",
    icon: "gift-outline",
  },
  {
    id: "2",
    title: "Wedding",
    date: "20 Sep 2026",
    icon: "heart-outline",
  },
  {
    id: "3",
    title: "Office Meeting",
    date: "25 Sep 2026",
    icon: "briefcase-outline",
  },
];

export default function MainScreen({ navigation }) {
  const [profileVisible, setProfileVisible] = useState(false);

  const renderEvent = ({ item }) => (
    <TouchableOpacity style={styles.eventCard}>
      <View style={styles.eventIconContainer}>
        <Ionicons
          name={item.icon}
          size={22}
          color="#ff7f86"
        />
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>
          {item.title}
        </Text>

        <Text style={styles.eventDate}>
          {item.date}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#999999"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>

        <View>
          <Text style={styles.appName}>
            InviteFlow
          </Text>

          <Text style={styles.welcomeText}>
            Welcome back, James
          </Text>
        </View>

        {/* Profile Icon */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setProfileVisible(true)}
        >
          <Ionicons
            name="person"
            size={22}
            color="#ffffff"
          />
        </TouchableOpacity>

      </View>

      {/* Add Event Section */}
      <View style={styles.actionContainer}>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("Events", {
              screen: "EventTypes",
            })
          }
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="add"
              size={25}
              color="#ff7f86"
            />
          </View>

          <Text style={styles.actionText}>
            Add Event
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("Events", {
              screen: "MyEvents",
            })
          }
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="calendar-outline"
              size={23}
              color="#ff7f86"
            />
          </View>

          <Text style={styles.actionText}>
            My Events
          </Text>
        </TouchableOpacity>

      </View>

      {/* Event List */}
      <View style={styles.eventsContainer}>

        <Text style={styles.sectionTitle}>
          Upcoming Events
        </Text>

        <FlatList
          data={UpComingevents}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.eventList}
        />

      </View>

      {/* Profile Side Popup */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileVisible(false)}
      >

        <View style={styles.modalContainer}>

          {/* Background overlay */}
          <Pressable
            style={styles.overlay}
            onPress={() => setProfileVisible(false)}
          />

          {/* Side menu */}
          <View style={styles.profileMenu}>

            {/* Profile Header */}
            <View style={styles.profileHeader}>

              <View style={styles.profileIcon}>
                <Ionicons
                  name="person"
                  size={35}
                  color="#ffffff"
                />
              </View>

              <Text style={styles.profileName}>
                James Martin
              </Text>

              <Text style={styles.profileRole}>
                Senior Graphic Designer
              </Text>

            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setProfileVisible(false);
                  navigation.navigate("EditProfile");
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={21}
                  color="#666666"
                />

                <Text style={styles.menuText}>
                  Edit Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setProfileVisible(false);
                  navigation.navigate("PaymentDetails");
                }}
              >
                <Ionicons
                  name="card-outline"
                  size={21}
                  color="#666666"
                />

                <Text style={styles.menuText}>
                  Payment Details
                </Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setProfileVisible(false);

                  // logout logic here
                  navigation.replace("Login");
                }}
              >
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color="#ff4d4f"
                />

                <Text style={styles.logoutText}>
                  Logout
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /* Header */

  header: {
    height: 75,
    backgroundColor: "#ff7f86",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  appName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },

  welcomeText: {
    color: "#ffffff",
    fontSize: 11,
    marginTop: 3,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Actions */

  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },

  actionButton: {
    flex: 1,
    height: 90,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },

  /* Events */

  eventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 25,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3d3d3d",
    marginBottom: 12,
  },

  eventList: {
    paddingBottom: 20,
  },

  eventCard: {
    height: 70,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  eventIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },

  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444444",
  },

  eventDate: {
    fontSize: 11,
    color: "#999999",
    marginTop: 4,
  },

  /* Profile Modal */

  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  profileMenu: {
    width: "78%",
    backgroundColor: "#ffffff",
    height: "100%",
  },

  profileHeader: {
    backgroundColor: "#ff7f86",
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 25,
    alignItems: "center",
  },

  profileIcon: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  profileName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  profileRole: {
    color: "#ffffff",
    fontSize: 11,
    marginTop: 4,
  },

  menuItems: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  menuItem: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
  },

  menuText: {
    fontSize: 14,
    color: "#555555",
    marginLeft: 15,
  },

  logoutText: {
    fontSize: 14,
    color: "#ff4d4f",
    marginLeft: 15,
  },

  menuDivider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 8,
  },
});