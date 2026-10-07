import apiClient from "./client";

export const requestAdminOtpApi = async (email) => {
  const response = await apiClient.post("/admin/auth/request-otp", { email });
  return response.data;
};

export const verifyAdminOtpApi = async (email, otp) => {
  const response = await apiClient.post("/admin/auth/verify-otp", { email, otp });
  return response.data;
};

export const getAdminProfileApi = async () => {
  const response = await apiClient.get("/admin/auth/me");
  return response.data;
};

export const getDashboardStatsApi = async () => {
  const response = await apiClient.get("/admin/dashboard");
  return response.data;
};

export const getUsersApi = async (params = {}) => {
  const response = await apiClient.get("/admin/users", { params });
  return response.data;
};

export const createCustomerApi = async (customer) => {
  const response = await apiClient.post("/admin/users", customer);
  return response.data;
};

export const updateCustomerApi = async (id, customer) => {
  const response = await apiClient.patch(`/admin/users/${id}`, customer);
  return response.data;
};

export const approveAccountApi = async (id) => {
  const response = await apiClient.post(`/admin/users/${id}/approve`);
  return response.data;
};

export const rejectAccountApi = async (id, reason = "") => {
  const response = await apiClient.post(`/admin/users/${id}/reject`, { reason });
  return response.data;
};

export const updateUserStatusApi = async (id, status) => {
  const response = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return response.data;
};

export const updateUserAccessApi = async (id, isEnabled) => {
  const response = await apiClient.patch(`/admin/users/${id}/access`, { isEnabled });
  return response.data;
};

export const deleteCustomerApi = async (id) => {
  const response = await apiClient.delete(`/admin/users/${id}`);
  return response.data;
};

export const updateUserRoleApi = async (id, role) => {
  const response = await apiClient.patch(`/admin/users/${id}/role`, { role });
  return response.data;
};

export const getWhatsAppDetailsApi = async () => {
  const response = await apiClient.get("/admin/whatsapp");
  return response.data;
};

export const getFirebaseDetailsApi = async () => {
  const response = await apiClient.get("/admin/firebase");
  return response.data;
};

export const getEventsApi = async (params = {}) => {
  const response = await apiClient.get("/admin/events", { params });
  return response.data;
};

export const getAdminEventTypesApi = async () => {
  const response = await apiClient.get("/admin/events/types");
  return response.data;
};

export const createAdminEventApi = async (eventData) => {
  const response = await apiClient.post("/admin/events", eventData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};

export const updateEventEnabledApi = async (id, isEnabled) => {
  const response = await apiClient.patch(`/admin/events/${id}/access`, { isEnabled });
  return response.data;
};

export const updateEventStatusApi = async (id, status) => {
  const response = await apiClient.patch(`/admin/events/${id}/status`, { status });
  return response.data;
};

export const updateEventApi = async (id, eventData) => {
  const response = await apiClient.patch(`/admin/events/${id}`, eventData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};

export const deleteEventApi = async (id) => {
  const response = await apiClient.delete(`/admin/events/${id}`);
  return response.data;
};

export const getContactsApi = async (params = {}) => {
  const response = await apiClient.get("/admin/contacts", { params });
  return response.data;
};

export const getSettingsApi = async () => {
  const response = await apiClient.get("/admin/settings");
  return response.data;
};

export const getSystemConfigApi = async () => {
  const response = await apiClient.get("/admin/system-config");
  return response.data;
};

export const saveSystemConfigApi = async (config) => {
  const response = await apiClient.put("/admin/system-config", config, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};

export const getEmailConfigApi = async () => {
  const response = await apiClient.get("/admin/config/email");
  return response.data;
};

export const saveEmailConfigApi = async (config) => {
  const response = await apiClient.put("/admin/config/email", config);
  return response.data;
};

export const getSmsConfigApi = async () => {
  const response = await apiClient.get("/admin/config/sms");
  return response.data;
};

export const saveSmsConfigApi = async (config) => {
  const response = await apiClient.put("/admin/config/sms", config);
  return response.data;
};
