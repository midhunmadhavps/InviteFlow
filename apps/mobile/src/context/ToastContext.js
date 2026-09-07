import React, { createContext, useContext, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setToast(null);
      });
    }, 2500);
  };

  const showSuccess = (message) => {
    showToast(message, "success");
  };

  const showError = (message) => {
    showToast(message, "error");
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
      }}
    >
      {children}

      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              backgroundColor:
                toast.type === "error"
                  ? "#ff4d4f"
                  : "#28a745",
            },
          ]}
        >
          <Text style={styles.message}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 55,
    left: 20,
    right: 20,
    minHeight: 50,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 16,
    zIndex: 9999,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,

    elevation: 5,
  },

  message: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});