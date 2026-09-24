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
import { bulkCreateContacts, getContactsByUserId } from "../api/contact.api";
import { getUser } from "../../../utils/auth";
import { useToast } from "../../../context/ToastContext";

export default function ContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    requestContactsPermission();
    loadSavedContacts();
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

  const loadSavedContacts = async () => {
    try {
      const user = await getUser();
      if (user?.id) {
        const savedContacts = await getContactsByUserId(user.id);
        // Merge with phone contacts if needed
        console.log("Saved contacts:", savedContacts);
      }
    } catch (error) {
      console.log("Load saved contacts error:", error);
    }
  };

  const saveSelectedContacts = async () => {
    if (selectedContacts.length === 0) {
      showError("Please select at least one contact.");
      return;
    }

    setSaving(true);
    try {
      const user = await getUser();
      if (!user?.id) {
        showError("User information not found.");
        return;
      }

      const contactsData = selectedContacts.map((contact) => ({
        contactDetails: contact,
        name: contact.name,
        phoneNumber: contact.phoneNumbers?.[0]?.number || "",
        email: contact.emails?.[0]?.email || null,
      }));

      await bulkCreateContacts({
        userId: user.id,
        contacts: contactsData,
      });

      showSuccess(`${selectedContacts.length} contacts saved successfully!`);
      setSelectedContacts([]);
    } catch (error) {
      console.log("Save contacts error:", error);
      showError(error.response?.data?.message || "Failed to save contacts.");
    } finally {
      setSaving(false);
    }
  };

  const renderContact = ({ item }) => {
    const isSelected = selectedContacts.some(
      (selected) => selected.id === item.id
    );

    return (
      <TouchableOpacity
        style={[
          styles.contactCard,
          isSelected && styles.contactCardSelected,
        ]}
        onPress={() => {
          if (isSelected) {
            setSelectedContacts(
              selectedContacts.filter((selected) => selected.id !== item.id)
            );
          } else {
            setSelectedContacts([...selectedContacts, item]);
          }
        }}
      >
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

        <View style={styles.contactSelection}>
          {isSelected ? (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#4CAF50"
            />
          ) : (
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#ff7f86"
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveSelectedContacts}
            disabled={saving || selectedContacts.length === 0}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save ({selectedContacts.length})
              </Text>
            )}
          </TouchableOpacity>
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

  saveButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
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

  contactCardSelected: {
    borderColor: "#ff7f86",
    backgroundColor: "#fff1f2",
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

  contactSelection: {
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