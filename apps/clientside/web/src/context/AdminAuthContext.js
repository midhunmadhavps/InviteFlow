import React, { createContext, useContext, useState, useEffect } from "react";
import {
  saveAdminToken,
  getAdminToken,
  removeAdminToken,
  saveAdminUser,
  getAdminUser,
  removeAdminUser,
  isAdminTokenExpired,
} from "../utils/auth";
import {
  requestAdminOtpApi,
  verifyAdminOtpApi,
  getAdminProfileApi,
} from "../api/admin.api";

const AdminAuthContext = createContext({});

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await getAdminToken();
        const storedUser = await getAdminUser();

        if (storedToken && !isAdminTokenExpired(storedToken) && storedUser && storedUser.role === "admin") {
          setToken(storedToken);
          setAdmin(storedUser);

          // Verify with backend
          try {
            const profileRes = await getAdminProfileApi();
            if (profileRes.success && profileRes.data) {
              setAdmin(profileRes.data);
              await saveAdminUser(profileRes.data);
            }
          } catch (e) {
            // If backend rejects (e.g. status changed), logout
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
              await logout();
            }
          }
        } else {
          await removeAdminToken();
          await removeAdminUser();
          setToken(null);
          setAdmin(null);
        }
      } catch (err) {
        console.error("Session restore error:", err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const requestOtp = async (email) => {
    setAuthError("");
    try {
      const res = await requestAdminOtpApi(email);
      return res;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to request OTP.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const verifyOtp = async (email, otp) => {
    setAuthError("");
    try {
      const res = await verifyAdminOtpApi(email, otp);
      if (res.success && res.data) {
        const { token: newToken, user } = res.data;
        if (user.role !== "admin") {
          throw new Error("Access denied. Admin privileges required.");
        }
        await saveAdminToken(newToken);
        await saveAdminUser(user);
        setToken(newToken);
        setAdmin(user);
        return res;
      }
      throw new Error("Verification failed.");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid OTP or verification failed.";
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    await removeAdminToken();
    await removeAdminUser();
    setToken(null);
    setAdmin(null);
    setAuthError("");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: Boolean(token && admin && admin.role === "admin"),
        loading,
        authError,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
