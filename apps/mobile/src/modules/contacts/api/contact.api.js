import api from "../../../api/client";

export const createContact = async (contactData) => {
  return await api.post("/contacts/create", contactData);
};

export const bulkCreateContacts = async (contactsData) => {
  return await api.post("/contacts/bulk-create", contactsData);
};

export const getContactsByUserId = async (userId) => {
  const response = await api.get(`/contacts/user/${userId}`);
  return response.data;
};

export const getContactById = async (contactId) => {
  const response = await api.get(`/contacts/${contactId}`);
  return response.data;
};

export const updateContact = async (contactId, updateData) => {
  const response = await api.put(`/contacts/${contactId}`, updateData);
  return response.data;
};

export const deleteContact = async (contactId) => {
  const response = await api.delete(`/contacts/${contactId}`);
  return response.data;
};