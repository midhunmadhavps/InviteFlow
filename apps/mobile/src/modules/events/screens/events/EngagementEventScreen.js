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
} from "../../../../utils/validation";
import { useToast } from "../../../../context/ToastContext";
import {
  RequiredLabel,
  Label,
} from "../../../../components/RequiredLabel";

export default function EngagementEventScreen({
  navigation,
  route,
}) {
  const { eventTypeId } = route.params || {};

  const { showSuccess, showError } = useToast();

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // --------------------------------------------------
  // Form State
  // --------------------------------------------------

  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");

  const [engagementDate, setEngagementDate] = useState("");
  const [engagementTime, setEngagementTime] = useState("");

  const [description, setDescription] = useState("");

  const [engagementAddress, setEngagementAddress] =
    useState("");

  const [engagementLocation, setEngagementLocation] =
    useState({
      address: "",
      latitude: null,
      longitude: null,
      googleMapsUrl: "",
    });

  // ONE image for Groom & Bride
  const [coupleImage, setCoupleImage] = useState(null);

  const [invitation, setInvitation] = useState(null);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showTimePicker, setShowTimePicker] =
    useState(false);

  const [saving, setSaving] = useState(false);

  // --------------------------------------------------
  // Convert URI to File - Web
  // --------------------------------------------------

  const uriToFile = async (uri, name, type) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new File([blob], name, {
      type: type || blob.type,
    });
  };

  // --------------------------------------------------
  // Pick Groom & Bride Image
  // --------------------------------------------------

  const pickCoupleImage = async () => {
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

      setCoupleImage(image);
    }
  };

  // --------------------------------------------------
  // Pick Invitation
  // --------------------------------------------------

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

  // --------------------------------------------------
  // Date Picker
  // --------------------------------------------------

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

      setEngagementDate(
        `${year}-${month}-${day}`
      );
    }
  };

  // --------------------------------------------------
  // Time Picker
  // --------------------------------------------------

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

      setEngagementTime(
        `${hours}:${minutes}`
      );
    }
  };

  // --------------------------------------------------
  // Validate Form
  // --------------------------------------------------

  const validateForm = () => {
    const fields = [
      {
        value: groomName,
        label: "Groom Name",
      },
      {
        value: brideName,
        label: "Bride Name",
      },
    ];

    for (const field of fields) {
      const errorMessage =
        validateNameOnly(
          field.value,
          field.label
        );

      if (errorMessage) {
        showError(errorMessage);
        return false;
      }
    }

    let errorMessage;

    errorMessage = validateDate(
      engagementDate,
      "Engagement Date"
    );

    if (errorMessage) {
      showError(errorMessage);
      return false;
    }

    errorMessage = validateTime(
      engagementTime,
      "Engagement Time"
    );

    if (errorMessage) {
      showError(errorMessage);
      return false;
    }

    errorMessage = validateLocation(
      engagementLocation,
      "Engagement Location"
    );

    if (errorMessage) {
      showError(errorMessage);
      return false;
    }

    errorMessage = validateRequired(
      engagementAddress,
      "Engagement Address"
    );

    if (errorMessage) {
      showError(errorMessage);
      return false;
    }

    // Only ONE image is required
    if (!coupleImage) {
      showError(
        "Please upload Groom & Bride image."
      );
      return false;
    }

    return true;
  };

  // --------------------------------------------------
  // Save Event
  // --------------------------------------------------

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

      // --------------------------------------------------
      // Basic Event Information
      // --------------------------------------------------

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
        `${groomName.trim()} & ${brideName.trim()} Engagement`
      );

      formData.append(
        "hostOne",
        groomName.trim()
      );

      formData.append(
        "hostTwo",
        brideName.trim()
      );

      formData.append(
        "eventDate",
        engagementDate
      );

      formData.append(
        "eventTime",
        engagementTime
      );

      formData.append(
        "message",
        description.trim()
      );

      formData.append(
        "address",
        engagementAddress.trim()
      );

      // --------------------------------------------------
      // Location
      // --------------------------------------------------

      formData.append(
        "location",
        JSON.stringify({
          address:
            engagementLocation.address.trim(),

          latitude:
            engagementLocation.latitude,

          longitude:
            engagementLocation.longitude,

          googleMapsUrl:
            engagementLocation.googleMapsUrl,
        })
      );

      // --------------------------------------------------
      // Status
      // --------------------------------------------------

      formData.append(
        "isPublished",
        "false"
      );

      formData.append(
        "status",
        "Draft"
      );

      // --------------------------------------------------
      // ONE Groom & Bride Image
      // --------------------------------------------------

      if (coupleImage) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            coupleImage.uri,
            coupleImage.fileName ||
              "groom-bride.jpg",
            coupleImage.mimeType ||
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
              uri: coupleImage.uri,
              name:
                coupleImage.fileName ||
                "groom-bride.jpg",
              type:
                coupleImage.mimeType ||
                "image/jpeg",
            }
          );
        }
      }

      // --------------------------------------------------
      // Invitation
      // --------------------------------------------------

      if (invitation) {
        if (Platform.OS === "web") {
          const file = await uriToFile(
            invitation.uri,
            invitation.name ||
              "engagement-invitation",
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
                "engagement-invitation",
              type:
                invitation.mimeType ||
                "application/pdf",
            }
          );
        }
      }

      // --------------------------------------------------
      // Create Event
      // --------------------------------------------------

      const response =
        await createEvent(formData);

      console.log(
        "Engagement created:",
        response.data
      );

      if (Platform.OS === "web") {
        window.alert(
          "Success\n\nEngagement event created successfully."
        );

        navigation.navigate(
          "MyEvents",
          {
            event:
              response.data.data,
          }
        );
      } else {
        Alert.alert(
          "Success",
          "Engagement event created successfully.",
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
        "Create engagement error:",
        error.response?.data ||
          error
      );

      showAlert(
        "Error",
        error.response?.data?.message ||
          "Failed to create Engagement event."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
            Create Engagement
          </Text>

          <View
            style={{
              width: 40,
            }}
          />

        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
        >

          {/* Groom Name */}

          <RequiredLabel>
            Groom Name
          </RequiredLabel>

          <TextInput
            style={styles.input}
            placeholder="Enter groom name"
            placeholderTextColor="#999"
            value={groomName}
            onChangeText={
              setGroomName
            }
          />

          {/* Bride Name */}

          <RequiredLabel>
            Bride Name
          </RequiredLabel>

          <TextInput
            style={styles.input}
            placeholder="Enter bride name"
            placeholderTextColor="#999"
            value={brideName}
            onChangeText={
              setBrideName
            }
          />

          {/* Engagement Date */}

          <RequiredLabel>
            Engagement Date
          </RequiredLabel>

          {Platform.OS === "web" ? (
            <View
              style={
                styles.webInputWrapper
              }
            >
              <input
                type="date"
                value={engagementDate}
                onChange={(e) =>
                  setEngagementDate(
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
                    engagementDate
                      ? styles.inputButtonText
                      : styles.placeholder
                  }
                >
                  {engagementDate ||
                    "Select engagement date"}
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
                    engagementDate
                      ? new Date(
                          `${engagementDate}T00:00:00`
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

          {/* Description */}

          <Label>
            Description
          </Label>

          <TextInput
            style={[
              styles.input,
              styles.descriptionInput,
            ]}
            placeholder="Enter engagement description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={
              setDescription
            }
          />

          {/* Engagement Time */}

          <RequiredLabel>
            Engagement Time
          </RequiredLabel>

          {Platform.OS === "web" ? (
            <View
              style={
                styles.webInputWrapper
              }
            >
              <input
                type="time"
                value={engagementTime}
                onChange={(e) =>
                  setEngagementTime(
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
                    engagementTime
                      ? styles.inputButtonText
                      : styles.placeholder
                  }
                >
                  {engagementTime ||
                    "Select engagement time"}
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

          {/* Engagement Address */}

          <RequiredLabel>
            Engagement Address
          </RequiredLabel>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Enter engagement address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={
              engagementAddress
            }
            onChangeText={
              setEngagementAddress
            }
          />

          {/* Engagement Location */}

          <RequiredLabel>
            Engagement Location
          </RequiredLabel>

          <View
            style={
              styles.locationInput
            }
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
              placeholder="Enter engagement location"
              placeholderTextColor="#999"
              value={
                engagementLocation.address
              }
              onChangeText={(text) =>
                setEngagementLocation(
                  (prev) => ({
                    ...prev,
                    address: text,
                  })
                )
              }
            />
          </View>

          {/* Groom & Bride Image */}

          <RequiredLabel>
            Groom & Bride Image
          </RequiredLabel>

          <TouchableOpacity
            style={
              styles.imageUpload
            }
            onPress={
              pickCoupleImage
            }
          >
            {coupleImage ? (
              <Image
                source={{
                  uri: coupleImage.uri,
                }}
                style={
                  styles.previewImage
                }
              />
            ) : (
              <>
                <Ionicons
                  name="camera-outline"
                  size={35}
                  color="#ff7f86"
                />

                <Text
                  style={
                    styles.uploadText
                  }
                >
                  Upload Groom & Bride Image
                </Text>

                <Text
                  style={
                    styles.uploadHint
                  }
                >
                  Tap to select image
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Invitation */}

          <TouchableOpacity
            style={
              styles.pdfButton
            }
            onPress={
              pickInvitation
            }
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
                  : "Upload Invitation PDF"}
              </Text>

              <Text
                style={
                  styles.pdfSubtitle
                }
              >
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
            onPress={
              saveEvent
            }
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
                : "Save Engagement Event"}
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
    height: 100,
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
    width: "100%",
    height: 220,
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 12,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    marginTop: 8,
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  uploadText: {
    fontSize: 13,
    color: "#666666",
    marginTop: 10,
    fontWeight: "600",
  },

  uploadHint: {
    fontSize: 11,
    color: "#999999",
    marginTop: 5,
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