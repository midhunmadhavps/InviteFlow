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

export default function AnniversaryEventScreen({ navigation,route }) {
  const { eventTypeId } = route.params || {};

  const [partnerOneName, setPartnerOneName] = useState("");
  const [partnerTwoName, setPartnerTwoName] = useState("");

  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [description, setDescription] = useState("");
  const [functionTime, setFunctionTime] = useState("");

  const [functionAddress, setFunctionAddress] = useState("");
  const [functionLocation, setFunctionLocation] = useState("");

  const [partnerOneImage, setPartnerOneImage] = useState(null);
  const [partnerTwoImage, setPartnerTwoImage] = useState(null);

  const [invitation, setInvitation] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  // =========================
  // Pick Partner Image
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

      if (type === "partnerOne") {
        setPartnerOneImage(image);
      } else {
        setPartnerTwoImage(image);
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

      setAnniversaryDate(
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

      setFunctionTime(`${hours}:${minutes}`);
    }
  };

  // =========================
  // Validation
  // =========================
  const validateForm = () => {
    if (!partnerOneName.trim()) {
      Alert.alert(
        "Required",
        "Please enter Partner 1 name."
      );
      return false;
    }

    if (!partnerTwoName.trim()) {
      Alert.alert(
        "Required",
        "Please enter Partner 2 name."
      );
      return false;
    }

    if (!anniversaryDate) {
      Alert.alert(
        "Required",
        "Please select anniversary date."
      );
      return false;
    }

    if (!description.trim()) {
      Alert.alert(
        "Required",
        "Please enter description."
      );
      return false;
    }

    if (!functionTime) {
      Alert.alert(
        "Required",
        "Please select function time."
      );
      return false;
    }

    if (!functionAddress.trim()) {
      Alert.alert(
        "Required",
        "Please enter function address."
      );
      return false;
    }

    if (!functionLocation.trim()) {
      Alert.alert(
        "Required",
        "Please enter function location."
      );
      return false;
    }

    if (!partnerOneImage) {
      Alert.alert(
        "Required",
        "Please select Partner 1 image."
      );
      return false;
    }

    if (!partnerTwoImage) {
      Alert.alert(
        "Required",
        "Please select Partner 2 image."
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
        "Anniversary"
      );

      formData.append(
        "partnerOneName",
        partnerOneName.trim()
      );

      formData.append(
        "partnerTwoName",
        partnerTwoName.trim()
      );

      formData.append(
        "anniversaryDate",
        anniversaryDate
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "functionTime",
        functionTime
      );

      formData.append(
        "functionAddress",
        functionAddress.trim()
      );

      formData.append(
        "functionLocation",
        functionLocation.trim()
      );

      // Partner 1 Image
      if (partnerOneImage) {
        formData.append("partnerOneImage", {
          uri: partnerOneImage.uri,
          name:
            partnerOneImage.fileName ||
            "partner-one-image.jpg",
          type:
            partnerOneImage.mimeType ||
            "image/jpeg",
        });
      }

      // Partner 2 Image
      if (partnerTwoImage) {
        formData.append("partnerTwoImage", {
          uri: partnerTwoImage.uri,
          name:
            partnerTwoImage.fileName ||
            "partner-two-image.jpg",
          type:
            partnerTwoImage.mimeType ||
            "image/jpeg",
        });
      }

      // Invitation PDF
      if (invitation) {
        formData.append("invitation", {
          uri: invitation.uri,
          name:
            invitation.name ||
            "anniversary-invitation.pdf",
          type:
            invitation.mimeType ||
            "application/pdf",
        });
      }

      const response = await api.post(
        "/event/create",
        formData
      );

      console.log(
        "Anniversary created:",
        response.data
      );

      Alert.alert(
        "Success",
        "Anniversary event created successfully.",
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
        "Create anniversary error:",
        error.response?.data || error
      );

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to create anniversary event."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../../../assets/Vector1.png")}
      style={styles.background}
      resizeMode="cover"
    >
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
            Create Anniversary
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* Partner 1 */}
          <Text style={styles.label}>
            Male Partner Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Male partner name"
            placeholderTextColor="#999"
            value={partnerOneName}
            onChangeText={setPartnerOneName}
          />

          {/* Partner 2 */}
          <Text style={styles.label}>
            Female Partner Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Female partner name"
            placeholderTextColor="#999"
            value={partnerTwoName}
            onChangeText={setPartnerTwoName}
          />

          {/* Anniversary Date */}
          <Text style={styles.label}>
            Anniversary Date *
          </Text>

          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={
                anniversaryDate
                  ? styles.inputButtonText
                  : styles.placeholder
              }
            >
              {anniversaryDate ||
                "Select anniversary date"}
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
              styles.multilineInput,
            ]}
            placeholder="Enter anniversary description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Function Time */}
          <Text style={styles.label}>
            Function Time *
          </Text>

          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text
              style={
                functionTime
                  ? styles.inputButtonText
                  : styles.placeholder
              }
            >
              {functionTime ||
                "Select function time"}
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

          {/* Function Address */}
          <Text style={styles.label}>
            Function Address *
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Enter function address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={functionAddress}
            onChangeText={setFunctionAddress}
          />

          {/* Function Location */}
          <Text style={styles.label}>
            Function Location *
          </Text>

          <View style={styles.locationInput}>
            <Ionicons
              name="location-outline"
              size={21}
              color="#ff7f86"
            />

            <TextInput
              style={styles.locationTextInput}
              placeholder="Enter function location"
              placeholderTextColor="#999"
              value={functionLocation}
              onChangeText={setFunctionLocation}
            />
          </View>

          {/* Images */}
          <View style={styles.imageRow}>

            {/* Partner 1 */}
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={() =>
                pickImage("partnerOne")
              }
            >
              {partnerOneImage ? (
                <Image
                  source={{
                    uri: partnerOneImage.uri,
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
                    Partner 1 Image
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Partner 2 */}
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={() =>
                pickImage("partnerTwo")
              }
            >
              {partnerTwoImage ? (
                <Image
                  source={{
                    uri: partnerTwoImage.uri,
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
                    Partner 2 Image
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
              saving && styles.disabledButton,
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
                : "Save Anniversary Event"}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "transparent",
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