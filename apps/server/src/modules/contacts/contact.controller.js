const contactService = require("./contact.service");

const createContact = async (req, res) => {
  try {
    const { userId, contactDetails, name, phoneNumber, email } = req.body;

    if (!userId || !contactDetails || !name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "userId, contactDetails, name, and phoneNumber are required.",
      });
    }

    const data = {
      userId,
      contactDetails,
      name,
      phoneNumber,
      email: email || null,
    };

    const result = await contactService.createContact(data);

    return res.status(201).json({
      success: true,
      message: "Contact created successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Create contact error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkCreateContacts = async (req, res) => {
  try {
    const { userId, contacts } = req.body;

    if (!userId || !contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        message: "userId and contacts array are required.",
      });
    }

    const contactsData = contacts.map((contact) => ({
      userId,
      contactDetails: contact.contactDetails || contact,
      name: contact.name,
      phoneNumber: contact.phoneNumber || (contact.phoneNumbers && contact.phoneNumbers[0]?.number),
      email: contact.email || (contact.emails && contact.emails[0]?.email) || null,
    }));

    const result = await contactService.bulkCreateContacts(contactsData);

    return res.status(201).json({
      success: true,
      message: "Contacts created successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Bulk create contacts error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getContactsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const result = await contactService.getContactsByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "Contacts loaded successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Load contacts error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getContactById = async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: "Contact ID is required.",
      });
    }

    const result = await contactService.getContactById(contactId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact loaded successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Load contact error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const updateData = req.body;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: "Contact ID is required.",
      });
    }

    const result = await contactService.updateContact(contactId, updateData);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact updated successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Update contact error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: "Contact ID is required.",
      });
    }

    const result = await contactService.deleteContact(contactId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Contact not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.log("Delete contact error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createContact,
  bulkCreateContacts,
  getContactsByUserId,
  getContactById,
  updateContact,
  deleteContact,
};