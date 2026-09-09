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

import { createEvent } from "../../api/event.api";
import { getUser } from "../../../../utils/auth";
import { validateNameOnly,validateDate,validateTime,validateLocation,validateRequired } from "../../../../utils/validation";
import { useToast } from "../../../../context/ToastContext";
import { RequiredLabel, Label } from "../../../../components/RequiredLabel";

export default function WeddingEventScreen({ navigation, route }) {
  const { eventTypeId } = route.params || {};

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };
  const { showSuccess, showError } = useToast();

  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [weddingTime, setWeddingTime] = useState("");
  const [description, setDescription] = useState("");
  const [weddingAddress, setWeddingAddress] = useState("");
  const [weddingLocation, setWeddingLocation] = useState({
    address: "",
    latitude: null,
    longitude: null,
    googleMapsUrl: "",
  });
  const [groomImage, setGroomImage] = useState(null);
  const [brideImage, setBrideImage] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const uriToFile = async (uri, name, type) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new File([blob], name, {
      type: type || blob.type,
    });
  };

  const pickImage = async (type) => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert(
        "Permission Required",
        "Please allow photo library access."
      );
      return;
    }

    const result =
    await ImagePicker.launchImageLibraryAsync({
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

  const pickInvitation = async () => {
    const result =
      await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
        ],
        copyToCacheDirectory: true,
      });

    if (!result.canceled) {
      setInvitation(result.assets[0]);
    }
  };

  const handleDateChange = (
    event,
    selectedDate
  ) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const year =
        selectedDate.getFullYear();

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

  const handleTimeChange = (
    event,
    selectedTime
  ) => {
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

  const validateForm = () => {

    const fields = [
      { value: groomName, label: "Groom Name" },
      { value: brideName, label: "Bride Name" },
    ];

    for (const field of fields) {
      const errorMessage = validateNameOnly(field.value, field.label);

      if (errorMessage) {
        showError(errorMessage);
        return false;
      }
    }

    let errorMessage;
    errorMessage = validateDate(weddingDate,"Wedding Date");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateTime(weddingTime, "Wedding Time");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateLocation(weddingLocation,"Wedding Location");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateRequired(weddingAddress,"Wedding Address");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    if (!groomImage) {
      showError("Please uplaod groom image.");
      return false;
    }

    if (!brideImage) {
      showError("Please uplaod bride image.");
      return false;
    }


    return true;
  };

  const saveEvent = async () => {
    if (!validateForm()) {
      return;
    }

    if (!eventTypeId) {
      showAlert(
        "Error",
        "Event type ID is missing."
      );
      return;
    }

    try {
      setSaving(true);

      const user = await getUser();

      if (!user?.id) {
        showAlert(
          "Error",
          "User information not found."
        );
        return;
      }

      const formData = new FormData();

      formData.append("userId", String(user.id));
      formData.append("eventTypeId", String(eventTypeId));
      formData.append("title", `${groomName.trim()} & ${brideName.trim()} Wedding`);
      formData.append("hostOne", groomName.trim());
      formData.append("hostTwo", brideName.trim());
      formData.append("eventDate", weddingDate);
      formData.append("eventTime", weddingTime);
      formData.append("message", description.trim());
      formData.append("address", weddingAddress.trim());

      formData.append(
        "location",
        JSON.stringify({
          address:
            weddingLocation.address.trim(),
          latitude:
            weddingLocation.latitude,
          longitude:
            weddingLocation.longitude,
          googleMapsUrl:
            weddingLocation.googleMapsUrl,
        })
      );

      formData.append("isPublished", "false");
      formData.append("status", "Draft");
      
      if (groomImage) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            groomImage.uri,
            groomImage.fileName || "host-one.jpg",
            groomImage.mimeType || "image/jpeg"
          );

          formData.append("hostOneImage", file);
        } else {
          formData.append("hostOneImage", {
            uri: groomImage.uri,
            name: groomImage.fileName || "host-one.jpg",
            type: groomImage.mimeType || "image/jpeg",
          });
        }
      }

      if (brideImage) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            brideImage.uri,
            brideImage.fileName || "host-two.jpg",
            brideImage.mimeType || "image/jpeg"
          );

          formData.append("hostTwoImage", file);
        } else {
          formData.append("hostTwoImage", {
            uri: brideImage.uri,
            name: brideImage.fileName || "host-two.jpg",
            type: brideImage.mimeType || "image/jpeg",
          });
        }
      }

      if (invitation) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            invitation.uri,
            invitation.name || "wedding-invitation",
            invitation.mimeType || "application/pdf"
          );

          formData.append("invitation", file);
        } else {
          formData.append("invitation", {
            uri: invitation.uri,
            name: invitation.name || "wedding-invitation",
            type: invitation.mimeType || "application/pdf",
          });
        }
      }

      // for (const [key, value] of formData.entries()) {
      //   console.log("FORMDATA:", key, value);
      // }

      const response = await createEvent(formData);

      console.log("Wedding created:",response.data);

      if (Platform.OS === "web") {
        window.alert("Success\n\nWedding event created successfully.");

        navigation.navigate("Main", {
          event: response.data.data,
        });
      } else {
        Alert.alert(
          "Success",
          "Wedding event created successfully.",
          [
            {
              text: "Continue",
              onPress: () => {
                navigation.navigate("Main", {
                  event: response.data.data,
                });
              },
            },
          ]
        );
      }
      
    } catch (error) {
      console.log(
        "Create wedding error:",
        error.response?.data ||
          error
      );

      showAlert(
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
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

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <ImageBackground
        source={require("../../../../../assets/Vector1.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >
          
          <RequiredLabel>Groom Name</RequiredLabel>

          <TextInput
            style={styles.input}
            placeholder="Enter groom name"
            placeholderTextColor="#999"
            value={groomName}
            onChangeText={setGroomName}
          />

          <RequiredLabel>Bride Name</RequiredLabel>

          <TextInput
            style={styles.input}
            placeholder="Enter bride name"
            placeholderTextColor="#999"
            value={brideName}
            onChangeText={setBrideName}
          />

          <RequiredLabel>Wedding Date</RequiredLabel>

          {Platform.OS === "web" ? (
            <View
              style={
                styles.webInputWrapper
              }
            >
              <input
                type="date"
                value={weddingDate}
                onChange={(e) =>
                  setWeddingDate(
                    e.target.value
                  )
                }
                style={
                  styles.webInput
                }
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={
                  styles.inputButton
                }
                onPress={() =>
                  setShowDatePicker(
                    true
                  )
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
                  value={
                    weddingDate
                      ? new Date(
                          `${weddingDate}T00:00:00`
                        )
                      : new Date()
                  }
                  mode="date"
                  display={
                    Platform.OS ===
                    "ios"
                      ? "spinner"
                      : "default"
                  }
                  onChange={
                    handleDateChange
                  }
                />
              )}
            </>
          )}

          <Label>Description</Label>

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
            onChangeText={
              setDescription
            }
          />

          <RequiredLabel>Wedding Time</RequiredLabel>

          {Platform.OS === "web" ? (
            <View
              style={
                styles.webInputWrapper
              }
            >
              <input
                type="time"
                value={weddingTime}
                onChange={(e) =>
                  setWeddingTime(
                    e.target.value
                  )
                }
                style={
                  styles.webInput
                }
              />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={
                  styles.inputButton
                }
                onPress={() =>
                  setShowTimePicker(
                    true
                  )
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
                    Platform.OS ===
                    "ios"
                      ? "spinner"
                      : "default"
                  }
                  onChange={
                    handleTimeChange
                  }
                />
              )}
            </>
          )}

          <RequiredLabel>Wedding Address</RequiredLabel>

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
            onChangeText={
              setWeddingAddress
            }
          />

          <RequiredLabel>Wedding Location</RequiredLabel>

          <View
            style={styles.locationInput}
          >
            <Ionicons
              name="location-outline"
              size={21}
              color="#ff7f86"
            />

            <TextInput
              style={
                styles.locationTextInput
              }
              placeholder="Enter wedding location"
              placeholderTextColor="#999"
              value={
                weddingLocation.address
              }
              onChangeText={(text) =>
                setWeddingLocation(
                  (prev) => ({
                    ...prev,
                    address: text,
                  })
                )
              }
            />
          </View>

          <View style={styles.imageRow}>
            <TouchableOpacity
              style={
                styles.imageUpload
              }
              onPress={() =>
                pickImage("groom")
              }
            >
              {groomImage ? (
                <Image
                  source={{
                    uri: groomImage.uri,
                  }}
                  style={
                    styles.previewImage
                  }
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color="#ff7f86"
                  />

                  <Text
                    style={
                      styles.uploadText
                    }
                  >
                    Groom Image
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.imageUpload
              }
              onPress={() =>
                pickImage("bride")
              }
            >
              {brideImage ? (
                <Image
                  source={{
                    uri: brideImage.uri,
                  }}
                  style={
                    styles.previewImage
                  }
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={30}
                    color="#ff7f86"
                  />

                  <Text
                    style={
                      styles.uploadText
                    }
                  >
                    Bride Image
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.pdfButton}
            onPress={pickInvitation}
          >
            <View
              style={styles.pdfIcon}
            >
              <Ionicons
                name="document-text-outline"
                size={25}
                color="#ff7f86"
              />
            </View>

            <View
              style={styles.pdfInfo}
            >
              <Text
                style={styles.pdfTitle}
                numberOfLines={1}
              >
                {invitation
                  ? invitation.name
                  : "Upload Invitation"}
              </Text>

              <Text
                style={
                  styles.pdfSubtitle
                }
              >
                {invitation
                  ? "File selected"
                  : "Tap to select PDF or image"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999"
            />
          </TouchableOpacity>

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

            <Text
              style={
                styles.saveButtonText
              }
            >
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

  webInputWrapper: {
    height: 48,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  webInput: {
    width: "100%",
    height: 40,
    backgroundColor: "transparent",
    fontSize: 13,
    color: "#333333",
    borderWidth: 0,
    padding: 0,
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