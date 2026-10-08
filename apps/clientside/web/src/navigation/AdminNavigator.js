import React, { useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Text,
} from "react-native";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

// Screens
import AdminLoginScreen from "../screens/AdminLoginScreen";
import AdminOtpScreen from "../screens/AdminOtpScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import CustomerScreen from "../screens/CustomerScreen";
import EventsScreen from "../screens/EventsScreen";
import PaymentScreen from "../screens/PaymentScreen";
import ConfigurationsScreen from "../screens/ConfigurationsScreen";
import WeddingRegistrationScreen from "../screens/events/WeddingRegistrationScreen";
import AnniversaryRegistrationScreen from "../screens/events/AnniversaryRegistrationScreen";
import EngagementRegistrationScreen from "../screens/events/EngagementRegistrationScreen";
import BirthdayRegistrationScreen from "../screens/events/BirthdayRegistrationScreen";
import { useAppTheme } from "../shared/theme/ThemeContext";

const EVENT_REGISTRATION_SCREENS = {
  wedding: WeddingRegistrationScreen,
  anniversary: AnniversaryRegistrationScreen,
  engagement: EngagementRegistrationScreen,
  birthday: BirthdayRegistrationScreen,
};

const AdminNavigator = () => {
  const { isAuthenticated, loading } = useAdminAuth();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  // Unauthenticated login / OTP step
  const [authStep, setAuthStep] = useState("login");
  const [pendingEmail, setPendingEmail] = useState("");

  // Authenticated tab
  const [activeTab, setActiveTab] = useState("dashboard");
  const [eventRegistration, setEventRegistration] = useState(null);
  const [eventRegistrationSuccess, setEventRegistrationSuccess] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Initializing InviteFlow Admin...</Text>
      </View>
    );
  }

  // If not authenticated, render Login / OTP screen
  if (!isAuthenticated) {
    if (authStep === "otp") {
      return (
        <AdminOtpScreen
          email={pendingEmail}
          onBackToLogin={() => setAuthStep("login")}
        />
      );
    }

    return (
      <AdminLoginScreen
        onOtpSent={(email) => {
          setPendingEmail(email);
          setAuthStep("otp");
        }}
      />
    );
  }

  // Titles for active tab
  const screenTitles = {
    dashboard: "Admin Dashboard",
    customer: "Customer Management",
    events: eventRegistration
      ? `Register ${eventRegistration.name}`
      : "Platform Events",
    payment: "Payment Management",
    configurations: "System Configurations",
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardScreen onNavigate={(tab) => setActiveTab(tab)} />;
      case "customer":
        return <CustomerScreen />;
      case "events":
        if (eventRegistration) {
          const RegistrationScreen = EVENT_REGISTRATION_SCREENS[
            eventRegistration.name?.trim().toLowerCase()
          ];
          if (RegistrationScreen) {
            return (
              <RegistrationScreen
                eventType={eventRegistration}
                onCancel={() => setEventRegistration(null)}
                onCreated={async (message) => {
                  setEventRegistration(null);
                  setEventRegistrationSuccess(message);
                }}
              />
            );
          }
        }
        return (
          <EventsScreen
            onRegisterEvent={(eventType) => {
              setEventRegistrationSuccess("");
              setEventRegistration(eventType);
            }}
            initialSuccessMessage={eventRegistrationSuccess}
          />
        );
      case "payment":
        return <PaymentScreen />;
      case "configurations":
        return <ConfigurationsScreen />;
      default:
        return <AdminDashboardScreen onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sidebar Navigation */}
      {(!isMobile || mobileMenuOpen) && (
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setEventRegistration(null);
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          isMobile={isMobile}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <View style={styles.mainArea}>
        <AdminHeader
          title={screenTitles[activeTab] || "Admin"}
          isMobile={isMobile}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <View style={styles.screenWrapper}>{renderActiveScreen()}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  screenWrapper: {
    flex: 1,
    minHeight: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
});

export default AdminNavigator;
