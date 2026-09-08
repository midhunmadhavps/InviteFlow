import api from "../../../api/client";

export const getEventTypes  = async () => {
  const response = await api.get("/event/event-types");

  return response.data;
};