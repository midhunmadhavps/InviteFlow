import React, { useEffect, useState } from "react";
import {
  AppState,
  ActivityIndicator,
  Image,
  Linking,
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
import {
  createRazorpayPaymentLink,
  getPaymentGatewayConfig,
  getRazorpayPaymentStatus,
} from "../api/event.api";

const PAYMENT_QR = require("../../../../../shared/public/assets/images/payment_qr.png");

export default function PaymentDetailsScreen({ navigation, route }) {
  const event = route.params?.event;
  const { showError, showSuccess } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [primaryProvider, setPrimaryProvider] = useState(null);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [selectedPaymentApp, setSelectedPaymentApp] = useState(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [gatewayError, setGatewayError] = useState("");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");

  useEffect(() => {
    let active = true;
    getPaymentGatewayConfig()
      .then((response) => {
        if (active) {
          setGatewayEnabled(response?.data?.enabled === true);
          setPrimaryProvider(response?.data?.primaryProvider || null);
          setRazorpayEnabled(
            response?.data?.providerEnabled?.razorpay === true
          );
        }
      })
      .catch((error) => {
        if (active) {
          setGatewayError(
            error.response?.data?.message ||
              "Unable to verify payment gateway availability."
          );
        }
      })
      .finally(() => {
        if (active) setGatewayLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshRazorpayPaymentStatus = async () => {
    if (!event?._id) return;
    setCheckingPayment(true);
    try {
      const response = await getRazorpayPaymentStatus(event._id);
      const status = response?.data?.status || "Pending";
      setPaymentStatus(status);
      if (response?.data?.approved) {
        setCheckoutOpened(false);
      }
    } catch (error) {
      showError(
        error.response?.data?.message ||
          "Unable to verify payment status. Please try again."
      );
    } finally {
      setCheckingPayment(false);
    }
  };

  useEffect(() => {
    if (!checkoutOpened) return undefined;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshRazorpayPaymentStatus();
    });
    return () => subscription.remove();
  }, [checkoutOpened, event?._id]);

  const startRazorpayPayment = async () => {
    if (!event?._id) {
      showError("Could not identify this event for payment.");
      return;
    }
    setRazorpayLoading(true);
    setGatewayError("");
    try {
      const response = await createRazorpayPaymentLink(event._id);
      const payment = response?.data;
      if (payment?.alreadyPaid) {
        setPaymentStatus("Approved");
        showSuccess("Payment for this event is already approved.");
        return;
      }
      if (!payment?.paymentUrl) {
        throw new Error("Razorpay did not return a checkout link.");
      }
      setPaymentStatus("Pending");
      await Linking.openURL(payment.paymentUrl);
      setCheckoutOpened(true);
    } catch (error) {
      showError(
        error.response?.data?.message ||
          error.message ||
          "Could not start Razorpay checkout."
      );
    } finally {
      setRazorpayLoading(false);
    }
  };

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

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
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

  const submitPaymentMethod = async () => {
    if (!selectedPaymentApp) {
      showError("Select GPay or PhonePe to continue.");
      return;
    }

    const appUrl =
      selectedPaymentApp === "GPay" ? "tez://upi/pay" : "phonepe://";
    try {
      await Linking.openURL(appUrl);
    } catch {
      showError(
        `${selectedPaymentApp} could not be opened. Make sure the app is installed, or use the QR code button above.`
      );
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
            <Ionicons name="card-outline" size={25} color="#ff7f86" />
          </View>
          <Text style={styles.title}>Pay for your event</Text>
          {event?.title ? (
            <Text style={styles.eventName}>{event.title}</Text>
          ) : null}
          {gatewayLoading ? (
            <ActivityIndicator
              style={styles.gatewayLoader}
              size="large"
              color="#ff7f86"
            />
          ) : !gatewayEnabled ? (
            <Text style={styles.gatewayMessage}>
              {gatewayError || "The payment gateway is currently disabled."}
            </Text>
          ) : (
            <>
              {showQrCode ? (
                <>
                  <View style={styles.qrHeading}>
                    <View style={styles.providerCopy}>
                      <Text style={styles.providerName}>Pay using QR code</Text>
                      <Text style={styles.providerDescription}>
                        Scan with a UPI payment app on another device
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.qrDownloadButton}
                      onPress={downloadQrCode}
                      disabled={downloading}
                      accessibilityRole="button"
                      accessibilityLabel="Download QR code"
                      activeOpacity={0.8}
                    >
                      {downloading ? (
                        <ActivityIndicator size="small" color="#ff7f86" />
                      ) : (
                        <Ionicons
                          name="download-outline"
                          size={21}
                          color="#ff7f86"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.qrContainer}>
                    <Image
                      source={PAYMENT_QR}
                      style={styles.qrImage}
                      resizeMode="contain"
                      accessibilityLabel="Payment QR code"
                    />
                  </View>
                </>
              ) : (
                primaryProvider === "razorpay" && razorpayEnabled ? (
                  <>
                    <Text style={styles.description}>
                      Pay securely with Razorpay. The event price is set by the
                      administrator.
                    </Text>
                    {event?.eventTypeId?.price > 0 ? (
                      <Text style={styles.razorpayAmount}>
                        ₹{Number(event.eventTypeId.price).toFixed(2)}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        razorpayLoading && styles.buttonDisabled,
                      ]}
                      onPress={startRazorpayPayment}
                      disabled={razorpayLoading}
                      activeOpacity={0.8}
                    >
                      {razorpayLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>
                            Pay with Razorpay
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#ffffff"
                          />
                        </>
                      )}
                    </TouchableOpacity>
                    {checkoutOpened || paymentStatus ? (
                      <View style={styles.paymentStatusContainer}>
                        <Text
                          style={[
                            styles.paymentStatusText,
                            paymentStatus === "Approved" &&
                              styles.paymentStatusApproved,
                          ]}
                        >
                          {paymentStatus === "Approved"
                            ? "Payment approved"
                            : "Payment pending confirmation"}
                        </Text>
                        <TouchableOpacity
                          style={styles.checkStatusButton}
                          onPress={refreshRazorpayPaymentStatus}
                          disabled={checkingPayment}
                          activeOpacity={0.8}
                        >
                          {checkingPayment ? (
                            <ActivityIndicator
                              size="small"
                              color="#ff7f86"
                            />
                          ) : (
                            <Text style={styles.checkStatusButtonText}>
                              Check payment status
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={styles.description}>
                      Select GPay or PhonePe, then submit to open the app on this
                      phone.
                    </Text>
                    <View style={styles.providerList}>
                      {["GPay", "PhonePe"].map((appName) => {
                        const isSelected = selectedPaymentApp === appName;
                        return (
                          <TouchableOpacity
                            key={appName}
                            style={[
                              styles.providerOption,
                              isSelected && styles.providerOptionSelected,
                            ]}
                            onPress={() => setSelectedPaymentApp(appName)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                          >
                            <View
                              style={[
                                styles.providerIcon,
                                isSelected && styles.providerIconSelected,
                              ]}
                            >
                              <Ionicons
                                name="phone-portrait-outline"
                                size={20}
                                color={isSelected ? "#ffffff" : "#ff7f86"}
                              />
                            </View>
                            <View style={styles.providerCopy}>
                              <Text style={styles.providerName}>{appName}</Text>
                              <Text style={styles.providerDescription}>
                                Open {appName} on this phone
                              </Text>
                            </View>
                            <Ionicons
                              name={
                                isSelected
                                  ? "checkmark-circle"
                                  : "ellipse-outline"
                              }
                              size={22}
                              color={isSelected ? "#16a34a" : "#aab0bb"}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        !selectedPaymentApp && styles.buttonDisabled,
                      ]}
                      onPress={submitPaymentMethod}
                      disabled={!selectedPaymentApp}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.submitButtonText}>Submit</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </>
                )
              )}
              {!showQrCode ? (
                <>
                  <View style={styles.orDivider}>
                    <View style={styles.orDividerLine} />
                    <Text style={styles.orDividerText}>OR</Text>
                    <View style={styles.orDividerLine} />
                  </View>
                  <TouchableOpacity
                    style={styles.qrOptionButton}
                    onPress={() => setShowQrCode(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="qr-code-outline"
                      size={20}
                      color="#ff7f86"
                    />
                    <Text style={styles.qrOptionButtonText}>
                      Pay using QR code
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              <Text style={styles.note}>
                Payment status must be approved before invite scheduling is
                enabled.
              </Text>
            </>
          )}
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
  razorpayAmount: {
    marginTop: 12,
    color: "#263957",
    fontSize: 24,
    fontWeight: "700",
  },
  paymentStatusContainer: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  paymentStatusText: {
    color: "#b7791f",
    fontSize: 13,
    fontWeight: "600",
  },
  paymentStatusApproved: {
    color: "#15803d",
  },
  checkStatusButton: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  checkStatusButtonText: {
    color: "#e85e68",
    fontSize: 13,
    fontWeight: "700",
  },
  gatewayLoader: {
    marginVertical: 28,
  },
  gatewayMessage: {
    marginTop: 22,
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  providerList: {
    width: "100%",
    gap: 10,
    marginTop: 18,
  },
  providerOption: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e6e8ed",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  providerOptionSelected: {
    borderColor: "#ff7f86",
    backgroundColor: "#fff8f8",
  },
  providerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#fff0f1",
  },
  providerIconSelected: {
    backgroundColor: "#ff7f86",
  },
  providerCopy: {
    flex: 1,
  },
  providerName: {
    color: "#263957",
    fontSize: 15,
    fontWeight: "700",
  },
  providerDescription: {
    marginTop: 3,
    color: "#687386",
    fontSize: 12,
  },
  qrHeading: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  qrDownloadButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "#ffe0e2",
    borderRadius: 10,
    backgroundColor: "#fff8f8",
  },
  submitButton: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 16,
    borderRadius: 11,
    backgroundColor: "#ff7f86",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  orDivider: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e6e8ed",
  },
  orDividerText: {
    color: "#818b9a",
    fontSize: 12,
    fontWeight: "700",
  },
  qrOptionButton: {
    width: "100%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ffb8bd",
    borderRadius: 11,
    backgroundColor: "#fff8f8",
  },
  qrOptionButtonText: {
    color: "#e85e68",
    fontSize: 14,
    fontWeight: "700",
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
  buttonDisabled: {
    opacity: 0.7,
  },
  note: {
    marginTop: 14,
    color: "#818b9a",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
