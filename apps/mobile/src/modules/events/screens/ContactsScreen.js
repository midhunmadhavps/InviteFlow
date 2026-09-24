import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";

export default function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestContactsPermission();
  }, []);

  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        setHasPermission(true);
        loadContacts();
      } else {
        Alert.alert(
          "Permission Required",
          "Please allow contacts access to select contacts.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Settings",
              onPress: () => {
                // Navigate to app settings (platform-specific)
                if (Platform.OS === "ios") {
                  // iOS settings navigation would go here
                } else {
                  // Android settings navigation would go here
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log("Contacts permission error:", error);
      Alert.alert("Error", "Failed to request contacts permission.");
    }
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (data.length > 0) {
        // Sort contacts by name
        const sortedContacts = data
          .filter((contact) => contact.name && contact.name.trim() !== "")
          .sort((a, b) => a.name.localeCompare(b.name));
        setContacts(sortedContacts);
      } else {
        setContacts([]);
      }
    } catch (error) {
      console.log("Load contacts error:", error);
      Alert.alert("Error", "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        <Ionicons
          name="person"
          size={24}
          color="#ff7f86"
        />
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>
          {item.name}
        </Text>

        {item.phoneNumbers && item.phoneNumbers.length > 0 && (
          <Text style={styles.contactPhone}>
            {item.phoneNumbers[0].number}
          </Text>
        )}

        {item.emails && item.emails.length > 0 && (
          <Text style={styles.contactEmail}>
            {item.emails[0].email}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.addContactButton}
        onPress={() => {
          // Handle adding contact
          Alert.alert("Contact Selected", `Selected: ${item.name}`);
        }}
      >
        <Ionicons
          name="add-circle-outline"
          size={24}
          color="#ff7f86"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="people-outline"
        size={64}
        color="#cccccc"
      />
      <Text style={styles.emptyStateText}>
        No contacts found
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Grant contacts permission to see your contacts
      </Text>
      {!hasPermission && (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestContactsPermission}
        >
          <Text style={styles.permissionButtonText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../../assets/Vector1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Header */}
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
            Add Contacts
          </Text>

          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color="#ff7f86"
              />
              <Text style={styles.loadingText}>
                Loading contacts...
              </Text>
            </View>
          ) : contacts.length > 0 ? (
            <FlatList
              data={contacts}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderContact}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contactsList}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  background: {
    flex: 1,
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

  content: {
    flex: 1,
    padding: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontSize: 14,
    color: "#666666",
    marginTop: 12,
  },

  contactsList: {
    paddingBottom: 20,
  },

  contactCard: {
    height: 80,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },

  contactAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },

  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263957",
  },

  contactPhone: {
    fontSize: 12,
    color: "#999999",
    marginTop: 4,
  },

  contactEmail: {
    fontSize: 11,
    color: "#cccccc",
    marginTop: 2,
  },

  addContactButton: {
    padding: 8,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginTop: 16,
  },

  emptyStateSubtext: {
    fontSize: 13,
    color: "#999999",
    marginTop: 8,
    textAlign: "center",
  },

  permissionButton: {
    backgroundColor: "#ff7f86",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },

  permissionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});