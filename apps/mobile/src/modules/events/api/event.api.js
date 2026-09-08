import api from "../../../api/client";

export const eventTypes = async (token) => {
  const response = await api.get("/event/event-types", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
