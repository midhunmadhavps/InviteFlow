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
import {
  validateNameOnly,
  validateDate,
  validateTime,
  validateLocation,
  validateRequired,
  validateImage,
  validateImageOrPdf
} from "../../../../utils/validation";
import { useToast } from "../../../../context/ToastContext";
import {
  RequiredLabel,
  Label,
} from "../../../../components/RequiredLabel";

export default function BirthdayEventScreen({
  navigation,
  route,
}) {
  const { eventTypeId } = route.params || {};

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const { showSuccess, showError } = useToast();

  const [name, setName] = useState("");
  const [birthdayDate, setBirthdayDate] = useState("");
  const [birthdayTime, setBirthdayTime] = useState("");
  const [description, setDescription] = useState("");

  const [birthdayAddress, setBirthdayAddress] =
    useState("");

  const [birthdayLocation, setBirthdayLocation] =
    useState({
      address: "",
      latitude: null,
      longitude: null,
      googleMapsUrl: "",
    });

  const [image, setImage] = useState(null);
  const [invitation, setInvitation] = useState(null);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showTimePicker, setShowTimePicker] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const uriToFile = async (uri, fileName, type) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: type || blob.type,
    });
  };

  const pickImage = async () => {
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
      setImage(result.assets[0]);
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

      setBirthdayDate(
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

      setBirthdayTime(
        `${hours}:${minutes}`
      );
    }
  };

  const validateForm = () => {

    let errorMessage;
    errorMessage = validateNameOnly(name,"Name");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateDate(birthdayDate,"Function Date");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateTime(birthdayTime,"Function Time");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateLocation(birthdayLocation,"Function Location");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateRequired(birthdayAddress,"Function Address");
    if (errorMessage) {
      showError(errorMessage);
      return;
    }

    errorMessage = validateImage(
      image,
      "image"
    );

    if (errorMessage) {
      showError(errorMessage);
      return false;
    }

    errorMessage = validateImageOrPdf(
      invitation,
      "Invitation"
    );

    if (errorMessage) {
      showError(errorMessage);
      return false;
    }

    return true;
  };

  const saveEvent = async () => {
    if (!validateForm()) {
      return;
    }

    if (!eventTypeId) {
      showError(
        "Event type ID is missing."
      );
      return;
    }

    try {
      setSaving(true);

      const user = await getUser();

      if (!user?.id) {
        showError(
          "User information not found."
        );
        return;
      }

      const formData = new FormData();

      formData.append(
        "userId",
        String(user.id)
      );

      formData.append(
        "eventTypeId",
        String(eventTypeId)
      );

      formData.append(
        "title",
        `${name.trim()}'s Birthday`
      );

      formData.append(
        "hostOne",
        name.trim()
      );

      formData.append(
        "hostTwo",
        ""
      );

      formData.append(
        "eventDate",
        birthdayDate
      );

      formData.append(
        "eventTime",
        birthdayTime
      );

      formData.append(
        "message",
        description.trim()
      );

      formData.append(
        "address",
        birthdayAddress.trim()
      );

      formData.append(
        "location",
        JSON.stringify({
          address:
            birthdayLocation.address.trim(),
          latitude:
            birthdayLocation.latitude,
          longitude:
            birthdayLocation.longitude,
          googleMapsUrl:
            birthdayLocation.googleMapsUrl,
        })
      );

      formData.append(
        "isPublished",
        "false"
      );

      formData.append(
        "status",
        "Draft"
      );

      if (image) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            image.uri,
            image.fileName ||
              "birthday-image.jpg",
            image.mimeType ||
              "image/jpeg"
          );

          formData.append(
            "hostOneImage",
            file
          );
        } else {
          formData.append(
            "hostOneImage",
            {
              uri: image.uri,
              name:
                image.fileName ||
                "birthday-image.jpg",
              type:
                image.mimeType ||
                "image/jpeg",
            }
          );
        }
      }

      if (invitation) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            invitation.uri,
            invitation.name ||
              "birthday-invitation",
            invitation.mimeType ||
              "application/pdf"
          );

          formData.append(
            "invitation",
            file
          );
        } else {
          formData.append(
            "invitation",
            {
              uri: invitation.uri,
              name:
                invitation.name ||
                "birthday-invitation",
              type:
                invitation.mimeType ||
                "application/pdf",
            }
          );
        }
      }

      for (const [key, value] of formData.entries()) {
        console.log("FORMDATA:", key, value);
      }

      const response =
        await createEvent(formData);

      console.log(
        "Birthday created:",
        response.data
      );

      showSuccess(
        "Birthday event created successfully."
      );

      if (Platform.OS === "web") {
        window.alert(
          "Success\n\nBirthday event created successfully."
        );

        navigation.navigate("MyEvents", {
          event: response.data.data,
        });
      } else {
        Alert.alert(
          "Success",
          "Birthday event created successfully.",
          [
            {
              text: "Continue",
              onPress: () => {
                navigation.navigate(
                  "MyEvents",
                  {
                    event:
                      response.data.data,
                  }
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log(
        "Create birthday error:",
        error.response?.data ||
          error
      );

      showError(
        error.response?.data?.message ||
          "Failed to create birthday event."
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

        <Text
          style={styles.headerTitle}
        >
          Create Birthday
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
          <RequiredLabel>
            Name
          </RequiredLabel>

          <TextInput
            style={styles.input}
            placeholder="Enter birthday name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <RequiredLabel>
            Function Date
          </RequiredLabel>

          {Platform.OS === "web" ? (
            <View
              style={
                styles.webInputWrapper
              }
            >
              <input
                type="date"
                value={birthdayDate}
                onChange={(e) =>
                  setBirthdayDate(
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
                    birthdayDate
                      ? styles.inputButtonText
                      : styles.placeholder
                  }
                >
                  {birthdayDate ||
                    "Select birthday date"}
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
                    birthdayDate
                      ? new Date(
                          `${birthdayDate}T00:00:00`
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

          <RequiredLabel>
            Function Time
          </RequiredLabel>

          {Platform.OS === "web" ? (
            <View
              style={
                styles.webInputWrapper
              }
            >
              <input
                type="time"
                value={birthdayTime}
                onChange={(e) =>
                  setBirthdayTime(
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
                    birthdayTime
                      ? styles.inputButtonText
                      : styles.placeholder
                  }
                >
                  {birthdayTime ||
                    "Select birthday time"}
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

          <Label>
            Description
          </Label>

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            placeholder="Enter birthday description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={
              setDescription
            }
          />

          <RequiredLabel>
            Function Address
          </RequiredLabel>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Enter birthday address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={birthdayAddress}
            onChangeText={
              setBirthdayAddress
            }
          />

          <RequiredLabel>
            Function Location
          </RequiredLabel>

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
              placeholder="Enter birthday location"
              placeholderTextColor="#999"
              value={
                birthdayLocation.address
              }
              onChangeText={(text) =>
                setBirthdayLocation(
                  (prev) => ({
                    ...prev,
                    address: text,
                  })
                )
              }
            />
          </View>

          <RequiredLabel>
            Image
          </RequiredLabel>

          <TouchableOpacity
            style={styles.imageUpload}
            onPress={pickImage}
          >
            {image ? (
              <Image
                source={{
                  uri: image.uri,
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
                  Birthday Image
                </Text>
              </>
            )}
          </TouchableOpacity>

          <RequiredLabel>
            Invitation
          </RequiredLabel>

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
                : "Save Birthday Event"}
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

  imageUpload: {
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
    marginTop: 8,
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