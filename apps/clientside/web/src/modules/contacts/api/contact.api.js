import apiClient from "../../../api/client";

export const getContactsApi = async (params = {}) => {
  const response = await apiClient.get("/admin/contacts", { params });
  return response.data;
};
