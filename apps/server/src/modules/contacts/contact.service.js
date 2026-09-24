const Contact = require("../../models/contact.model");

const createContact = async (data) => {
  try {
    const contact = await Contact.create(data);
    return contact;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      throw new Error("Contact with this phone number already exists for this user.");
    }
    throw error;
  }
};

const getContactsByUserId = async (userId) => {
  const contacts = await Contact.find({ userId })
    .sort({ name: 1 });

  return contacts;
};

const getContactById = async (contactId) => {
  const contact = await Contact.findById(contactId);
  return contact;
};

const updateContact = async (contactId, updateData) => {
  const updated = await Contact.findByIdAndUpdate(
    contactId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updated;
};

const deleteContact = async (contactId) => {
  const deleted = await Contact.findByIdAndDelete(contactId);
  return deleted;
};

const bulkCreateContacts = async (contactsData) => {
  try {
    const contacts = await Contact.insertMany(contactsData, { ordered: false });
    return contacts;
  } catch (error) {
    // Handle duplicate errors but still return successful inserts
    if (error.code === 11000) {
      const successfulContacts = error.result ? error.result.insertedDocs : [];
      return successfulContacts;
    }
    throw error;
  }
};

module.exports = {
  createContact,
  getContactsByUserId,
  getContactById,
  updateContact,
  deleteContact,
  bulkCreateContacts,
};