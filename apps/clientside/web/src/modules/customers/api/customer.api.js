import apiClient from "../../../api/client";

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
