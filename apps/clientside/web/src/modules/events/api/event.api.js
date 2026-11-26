import apiClient from "../../../api/client";

export const getEventsApi = async (params = {}) => {
  const response = await apiClient.get("/admin/events", { params });
  return response.data;
};

export const getAdminEventTypesApi = async () => {
  const response = await apiClient.get("/admin/events/types");
  return response.data;
};

export const createAdminEventTypeApi = async (eventType) => {
  const formData = new FormData();
  Object.entries(eventType).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const response = await apiClient.post("/admin/events/types", formData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};

export const updateAdminEventTypeApi = async (id, eventType) => {
  const formData = new FormData();
  Object.entries(eventType).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  const response = await apiClient.patch(`/admin/events/types/${id}`, formData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};

export const deleteAdminEventTypeApi = async (id) => {
  const response = await apiClient.delete(`/admin/events/types/${id}`);
  return response.data;
};

export const updateEventTypePriceApi = async (id, price) => {
  const response = await apiClient.patch(`/admin/events/types/${id}/price`, {
    price,
  });
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
