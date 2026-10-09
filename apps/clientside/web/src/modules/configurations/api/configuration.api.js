import apiClient from "../../../api/client";

export const getWhatsAppDetailsApi = async () => {
  const response = await apiClient.get("/admin/whatsapp");
  return response.data;
};

export const getSettingsApi = async () => {
  const response = await apiClient.get("/admin/settings");
  return response.data;
};

export const saveSettingsApi = async (settings) => {
  const response = await apiClient.put("/admin/settings", settings);
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
