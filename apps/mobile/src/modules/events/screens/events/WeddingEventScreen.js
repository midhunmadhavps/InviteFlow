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
  ImageBackground,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import api from "../../../../api/client";

export default function WeddingEventScreen({ navigation }) {
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");

  const [weddingDate, setWeddingDate] = useState("");
  const [weddingTime, setWeddingTime] = useState("");

  const [description, setDescription] = useState("");

  const [weddingAddress, setWeddingAddress] = useState("");
  const [weddingLocation, setWeddingLocation] = useState("");

  const [groomImage, setGroomImage] = useState(null);
  const [brideImage, setBrideImage] = useState(null);

  const [invitation, setInvitation] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  // =========================
  // Pick Groom / Bride Image
  // =========================
  const pickImage = async (type) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
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
      const image = result.assets[0];

      if (type === "groom") {
        setGroomImage(image);
      } else {
        setBrideImage(image);
      }
    }
  };

  // =========================
  // Pick Invitation PDF
  // =========================
  const pickInvitation = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setInvitation(result.assets[0]);
    }
  };

  // =========================
  // Date Picker
  // =========================
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const year = selectedDate.getFullYear();

      const month = String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        selectedDate.getDate()
      ).padStart(2, "0");

      setWeddingDate(
        `${year}-${month}-${day}`
      );
    }
  };

  // =========================
  // Time Picker
  // =========================
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);

    if (selectedTime) {
      const hours = String(
        selectedTime.getHours()
      ).padStart(2, "0");

      const minutes = String(
        selectedTime.getMinutes()
      ).padStart(2, "0");

      setWeddingTime(
        `${hours}:${minutes}`
      );
    }
  };

  // =========================
  // Validation
  // =========================
  const validateForm = () => {
    if (!groomName.trim()) {
      Alert.alert(
        "Required",
        "Please enter groom name."
      );
      return false;
    }

    if (!brideName.trim()) {
      Alert.alert(
        "Required",
        "Please enter bride name."
      );
      return false;
    }

    if (!weddingDate) {
      Alert.alert(
        "Required",
        "Please select wedding date."
      );
      return false;
    }

    if (!description.trim()) {
      Alert.alert(
        "Required",
        "Please enter wedding description."
      );
      return false;
    }

    if (!weddingTime) {
      Alert.alert(
        "Required",
        "Please select wedding time."
      );
      return false;
    }

    if (!weddingAddress.trim()) {
      Alert.alert(
        "Required",
        "Please enter wedding address."
      );
      return false;
    }

    if (!weddingLocation.trim()) {
      Alert.alert(
        "Required",
        "Please enter wedding location."
      );
      return false;
    }

    if (!groomImage) {
      Alert.alert(
        "Required",
        "Please select groom image."
      );
      return false;
    }

    if (!brideImage) {
      Alert.alert(
        "Required",
        "Please select bride image."
      );
      return false;
    }

    if (!invitation) {
      Alert.alert(
        "Required",
        "Please select invitation PDF."
      );
      return false;
    }

    return true;
  };

  // =========================
  // Save Event API
  // =========================
  const saveEvent = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append(
        "eventType",
        "Wedding"
      );

      formData.append(
        "groomName",
        groomName.trim()
      );

      formData.append(
        "brideName",
        brideName.trim()
      );

      formData.append(
        "weddingDate",
        weddingDate
      );

      formData.append(
        "weddingTime",
        weddingTime
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "weddingAddress",
        weddingAddress.trim()
      );

      formData.append(
        "weddingLocation",
        weddingLocation.trim()
      );

      // Groom image
      if (groomImage) {
        formData.append("groomImage", {
          uri: groomImage.uri,
          name:
            groomImage.fileName ||
            "groom-image.jpg",
          type:
            groomImage.mimeType ||
            "image/jpeg",
        });
      }

      // Bride image
      if (brideImage) {
        formData.append("brideImage", {
          uri: brideImage.uri,
          name:
            brideImage.fileName ||
            "bride-image.jpg",
          type:
            brideImage.mimeType ||
            "image/jpeg",
        });
      }

      // Invitation PDF
      if (invitation) {
        formData.append("invitation", {
          uri: invitation.uri,
          name:
            invitation.name ||
            "invitation.pdf",
          type:
            invitation.mimeType ||
            "application/pdf",
        });
      }

      const response = await api.post(
        "/event/create",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "Wedding created:",
        response.data
      );

      Alert.alert(
        "Success",
        "Wedding event created successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              navigation.navigate("Reminder", {
                event: response.data.data,
              });
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "Create wedding error:",
        error.response?.data || error
      );

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create wedding event."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* =========================
          Header
      ========================= */}
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
          Create Wedding
        </Text>

        <View style={{ width: 40 }} />

      </View>

      {/* =========================
          Background
      ========================= */}
      <ImageBackground
        source={require("../../../../../assets/Vector1.png")}
        style={styles.background}
        resizeMode="cover"
      >

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* Groom Name */}
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

          {/* Bride Name */}
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

          {/* Wedding Date */}
          <Text style={styles.label}>
            Wedding Date *
          </Text>

          <TouchableOpacity
            style={styles.inputButton}
            onPress={() =>
              setShowDatePicker(true)
            }
          >

            <Text
              style={
                weddingDate
                  ? styles.inputButtonText
                  : styles.placeholder
              }
            >
              {weddingDate ||
                "Select wedding date"}
            </Text>

            <Ionicons
              name="calendar-outline"
              size={21}
              color="#ff7f86"
            />

          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={handleDateChange}
            />
          )}

          {/* Description */}
          <Text style={styles.label}>
            Description *
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            placeholder="Enter wedding description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Wedding Time */}
          <Text style={styles.label}>
            Wedding Time *
          </Text>

          <TouchableOpacity
            style={styles.inputButton}
            onPress={() =>
              setShowTimePicker(true)
            }
          >

            <Text
              style={
                weddingTime
                  ? styles.inputButtonText
                  : styles.placeholder
              }
            >
              {weddingTime ||
                "Select wedding time"}
            </Text>

            <Ionicons
              name="time-outline"
              size={21}
              color="#ff7f86"
            />

          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={handleTimeChange}
            />
          )}

          {/* Wedding Address */}
          <Text style={styles.label}>
            Wedding Address *
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Enter wedding address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={weddingAddress}
            onChangeText={setWeddingAddress}
          />

          {/* Wedding Location */}
          <Text style={styles.label}>
            Wedding Location *
          </Text>

          <View style={styles.locationInput}>

            <Ionicons
              name="location-outline"
              size={21}
              color="#ff7f86"
            />

            <TextInput
              style={styles.locationTextInput}
              placeholder="Enter wedding location"
              placeholderTextColor="#999"
              value={weddingLocation}
              onChangeText={setWeddingLocation}
            />

          </View>

          {/* Images */}
          <View style={styles.imageRow}>

            {/* Groom */}
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={() =>
                pickImage("groom")
              }
            >

              {groomImage ? (
                <Image
                  source={{
                    uri: groomImage.uri,
                  }}
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

            {/* Bride */}
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={() =>
                pickImage("bride")
              }
            >

              {brideImage ? (
                <Image
                  source={{
                    uri: brideImage.uri,
                  }}
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

          </View>

          {/* Invitation PDF */}
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

              <Text
                style={styles.pdfTitle}
                numberOfLines={1}
              >
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

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving &&
                styles.disabledButton,
            ]}
            onPress={saveEvent}
            disabled={saving}
          >

            <Ionicons
              name={
                saving
                  ? "cloud-upload-outline"
                  : "checkmark-circle-outline"
              }
              size={22}
              color="#ffffff"
            />

            <Text style={styles.saveButtonText}>
              {saving
                ? "Saving..."
                : "Save Wedding Event"}
            </Text>

          </TouchableOpacity>

        </ScrollView>

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

  background: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444444",
    marginBottom: 7,
    marginTop: 17,
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

  descriptionInput: {
    height: 95,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  multilineInput: {
    height: 85,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  inputButton: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },

  inputButtonText: {
    fontSize: 13,
    color: "#333333",
  },

  placeholder: {
    fontSize: 13,
    color: "#999999",
  },

  locationInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
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
    marginTop: 8,
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
    backgroundColor: "#ffffff",
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
    marginTop: 18,
    backgroundColor: "#ffffff",
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

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
});