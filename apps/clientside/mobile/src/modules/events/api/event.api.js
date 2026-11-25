import api from "../../../api/client";

export const getEventTypes  = async () => {
  const response = await api.get("/event/event-types");

  return response.data;
};

export const createEvent = async (formData) => {
  return await api.post("/event/create-event", formData);
};

export const getMyEvents = async (userId) => {
  const response = await api.get(`/event/events-list/${userId}`);
  return response.data;
};

export const updateEvent = async (id, data) => {
  const response = await api.put(`/event/update-event/${id}`, data);
  return response.data;
};

export const scheduleInvites = async (scheduleData) => {
  const response = await api.post("/schedule-invites", scheduleData);
  return response.data;
};

export const getEventPaymentStatus = async (eventId) => {
  const response = await api.get("/schedule-invites/payment-status", {
    params: { eventId },
  });
  return response.data;
};

export const getPaymentGatewayConfig = async () => {
  const response = await api.get("/event/payment-gateway/config");
  return response.data;
};

export const sendEventInvites = async (inviteData) => {
  const response = await api.post("/event/send-invites", inviteData);
  return response.data;
};

export const getScheduleInvites = async (eventId) => {
  const response = await api.get("/schedule-invites", {
    params: eventId ? { eventId } : {},
  });
  return response.data;
};

export const updateScheduleInviteStatus = async (id, isComplete) => {
  const response = await api.patch(`/schedule-invites/${id}`, {
    is_complete: isComplete,
  });
  return response.data;
};

export const deleteScheduleInvite = async (id) => {
  const response = await api.delete(`/schedule-invites/${id}`);
  return response.data;
};