import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Baby Shower"
];

export default function CreateEventScreen({ navigation }) {
  const [eventType, setEventType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");

  const [marriageAddress, setMarriageAddress] = useState("");
  const [marriageLocation, setMarriageLocation] = useState("");

  const [brideImage, setBrideImage] = useState(null);
  const [groomImage, setGroomImage] = useState(null);
  const [invitation, setInvitation] = useState(null);

  // Pick bride/groom image
  const pickImage = async (type) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo library access."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === "bride") {
        setBrideImage(result.assets[0].uri);
      } else {
        setGroomImage(result.assets[0].uri);
      }
    }
  };

  // Pick invitation PDF
  const pickInvitation = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setInvitation(result.assets[0]);
    }
  };

  // Save event
  const saveEvent = () => {
    if (!eventType) {
      Alert.alert("Required", "Please select an event type.");
      return;
    }

    if (eventType === "Wedding") {
      if (!groomName.trim()) {
        Alert.alert("Required", "Please enter groom name.");
        return;
      }

      if (!brideName.trim()) {
        Alert.alert("Required", "Please enter bride name.");
        return;
      }

      if (!marriageAddress.trim()) {
        Alert.alert("Required", "Please enter marriage address.");
        return;
      }

      if (!marriageLocation.trim()) {
        Alert.alert("Required", "Please enter marriage location.");
        return;
      }
    }

    const eventData = {
      eventType,
      groomName,
      brideName,
      marriageAddress,
      marriageLocation,
      brideImage,
      groomImage,
      invitation,
    };

    console.log("EVENT DATA:", eventData);

    Alert.alert(
      "Event Created",
      "Your event has been created successfully.",
      [
        {
          text: "Continue",
          onPress: () => {
            navigation.navigate("Reminder", {
              event: eventData,
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

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
          Create Event
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* Event Type */}
        <Text style={styles.label}>
          Event Type *
        </Text>

        <TouchableOpacity
          style={styles.selectBox}
          onPress={() =>
            setDropdownVisible(!dropdownVisible)
          }
        >
          <Text
            style={
              eventType
                ? styles.selectText
                : styles.placeholder
            }
          >
            {eventType || "Select event type"}
          </Text>

          <Ionicons
            name={
              dropdownVisible
                ? "chevron-up"
                : "chevron-down"
            }
            size={20}
            color="#777777"
          />
        </TouchableOpacity>

        {/* Dropdown */}
        {dropdownVisible && (
          <View style={styles.dropdown}>
            {EVENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.dropdownItem}
                onPress={() => {
                  setEventType(type);
                  setDropdownVisible(false);
                }}
              >
                <Text style={styles.dropdownText}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}


        {/* Wedding Fields */}
        {(eventType === "Wedding" || eventType === "Engagement") && (
          <>
            <Text style={styles.sectionTitle}>
              Wedding Details
            </Text>

            {/* Groom */}
            <Text style={styles.label}>
              Groom Name *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter groom name"
              placeholderTextColor="#999"
              value={groomName}
              onChangeText={setGroomName}
            />

            {/* Bride */}
            <Text style={styles.label}>
              Bride Name *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter bride name"
              placeholderTextColor="#999"
              value={brideName}
              onChangeText={setBrideName}
            />

            {/* Marriage Address */}
            <Text style={styles.label}>
              Marriage Address *
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
              ]}
              placeholder="Enter marriage address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={marriageAddress}
              onChangeText={setMarriageAddress}
            />

            {/* Marriage Location */}
            <Text style={styles.label}>
              Marriage Location *
            </Text>

            <View style={styles.locationInput}>
              <Ionicons
                name="location-outline"
                size={21}
                color="#ff7f86"
              />

              <TextInput
                style={styles.locationTextInput}
                placeholder="Enter location"
                placeholderTextColor="#999"
                value={marriageLocation}
                onChangeText={setMarriageLocation}
              />
            </View>

            {/* Images */}
            <Text style={styles.sectionTitle}>
              Couple Images
            </Text>

            <View style={styles.imageRow}>

              {/* Bride */}
              <TouchableOpacity
                style={styles.imageUpload}
                onPress={() => pickImage("bride")}
              >
                {brideImage ? (
                  <Image
                    source={{ uri: brideImage }}
                    style={styles.previewImage}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="camera-outline"
                      size={30}
                      color="#ff7f86"
                    />

                    <Text style={styles.uploadText}>
                      Bride Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Groom */}
              <TouchableOpacity
                style={styles.imageUpload}
                onPress={() => pickImage("groom")}
              >
                {groomImage ? (
                  <Image
                    source={{ uri: groomImage }}
                    style={styles.previewImage}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="camera-outline"
                      size={30}
                      color="#ff7f86"
                    />

                    <Text style={styles.uploadText}>
                      Groom Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>

            </View>

            {/* Invitation */}
            <Text style={styles.sectionTitle}>
              Invitation
            </Text>

            <TouchableOpacity
              style={styles.pdfButton}
              onPress={pickInvitation}
            >
              <View style={styles.pdfIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color="#ff7f86"
                />
              </View>

              <View style={styles.pdfInfo}>
                <Text style={styles.pdfTitle}>
                  {invitation
                    ? invitation.name
                    : "Upload Invitation PDF"}
                </Text>

                <Text style={styles.pdfSubtitle}>
                  {invitation
                    ? "PDF selected"
                    : "Tap to select PDF"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveEvent}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color="#ffffff"
          />

          <Text style={styles.saveButtonText}>
            Save Event
          </Text>
        </TouchableOpacity>

      </ScrollView>
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

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444444",
    marginBottom: 7,
    marginTop: 15,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#333333",
    backgroundColor: "#ffffff",
  },

  multilineInput: {
    height: 85,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  selectBox: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: 13,
    color: "#333333",
  },

  placeholder: {
    fontSize: 13,
    color: "#999999",
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  dropdownItem: {
    height: 45,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },

  dropdownText: {
    fontSize: 13,
    color: "#444444",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3d3d3d",
    marginTop: 28,
    marginBottom: 5,
  },

  locationInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  locationTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#333333",
  },

  imageRow: {
    flexDirection: "row",
    gap: 12,
  },

  imageUpload: {
    flex: 1,
    height: 150,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 12,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  uploadText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 8,
    fontWeight: "600",
  },

  pdfButton: {
    height: 70,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  pdfIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
    justifyContent: "center",
    alignItems: "center",
  },

  pdfInfo: {
    flex: 1,
    marginLeft: 12,
  },

  pdfTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444444",
  },

  pdfSubtitle: {
    fontSize: 11,
    color: "#999999",
    marginTop: 4,
  },

  saveButton: {
    height: 52,
    backgroundColor: "#ff7f86",
    borderRadius: 12,
    marginTop: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
});