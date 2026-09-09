import api from "../../../api/client";

export const getEventTypes  = async () => {
  const response = await api.get("/event/event-types");

  return response.data;
};

export const createEvent = async (formData) => {
  return await api.post("/event/create-event", formData);
};