import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useToast } from "../../../context/ToastContext";

const PAYMENT_QR = require("../../../../../shared/public/assets/images/payment_qr.png");

export default function PaymentQrScreen({ navigation, route }) {
  const event = route.params?.event;
  const { showError } = useToast();
  const [downloading, setDownloading] = useState(false);

  const downloadQrCode = async () => {
    if (Platform.OS === "web") {
      const imageUri = Image.resolveAssetSource(PAYMENT_QR)?.uri;
      if (!imageUri) {
        showError("Could not load the payment QR code.");
        return;
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = imageUri;
      downloadLink.download = "payment_qr.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      return;
    }

    setDownloading(true);
    try {
      const asset = Asset.fromModule(PAYMENT_QR);
      await asset.downloadAsync();
      if (!asset.localUri) {
        throw new Error("The payment QR code could not be prepared for download.");
      }

      const fileUri = `${FileSystem.documentDirectory}payment_qr.png`;
      const existingFile = await FileSystem.getInfoAsync(fileUri);
      if (!existingFile.exists) {
        await FileSystem.copyAsync({ from: asset.localUri, to: fileUri });
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("File sharing is not available on this device.");
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        dialogTitle: "Save payment QR code",
        UTI: "public.png",
      });
    } catch (error) {
      showError(error.message || "Could not download the payment QR code.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={23} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <Ionicons name="qr-code-outline" size={26} color="#ff7f86" />
          </View>
          <Text style={styles.title}>Pay by QR code</Text>
          {event?.title ? (
            <Text style={styles.eventName}>{event.title}</Text>
          ) : null}
          <Text style={styles.description}>
            Scan this QR code with your UPI payment app. Once payment is
            approved, you can schedule invitations.
          </Text>

          <View style={styles.qrContainer}>
            <Image
              source={PAYMENT_QR}
              style={styles.qrImage}
              resizeMode="contain"
              accessibilityLabel="Payment QR code"
            />
          </View>

          <TouchableOpacity
            style={[styles.downloadButton, downloading && styles.buttonDisabled]}
            onPress={downloadQrCode}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={19} color="#ffffff" />
                <Text style={styles.downloadButtonText}>Download QR Code</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff8f8",
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
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    alignItems: "center",
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    shadowColor: "#263957",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "#fff0f1",
  },
  title: {
    marginTop: 14,
    color: "#263957",
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
  },
  eventName: {
    marginTop: 5,
    color: "#ff7f86",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    marginTop: 10,
    color: "#687386",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  qrContainer: {
    width: 260,
    height: 260,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e6e8ed",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  downloadButton: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 20,
    borderRadius: 11,
    backgroundColor: "#ff7f86",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
