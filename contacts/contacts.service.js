const { Contact } = require("./contact.model");

const listContacts = async () => {
  try {
    const jsondata = await Contact.find();
    console.log(jsondata);
    return jsondata;
  } catch (error) {
    console.error("Error. Could not list contacts", error.message);
    throw "Cannot read contacts";
  }
};

const getContactById = async (contactId) => {
  try {
    const searchedContact = await Contact.findById(contactId);
    return searchedContact;
  } catch {
    const message = "Cannot find contact with id " + contactId;
    console.error(message);
    return undefined;
  }
};

const removeContact = async (contactId) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(contactId);
    return deletedContact;
  } catch (error) {
    console.error("Error. Could not delete contact", error.message);
    return undefined;
  }
};

const addContact = async (body) => {
  try {
    const newContact = Contact.create(body);
    return newContact;
  } catch (error) {
    console.error("Error. Could not write file", error.message);
    throw "Cannot add contact";
  }
};

const updateContact = async (contactId, body) => {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(contactId, body, {
      new: true,
    });
    return updatedContact;
  } catch (error) {
    console.error("Error. Could not update contact", error.message);
    throw "Cannot update contact with id " + contactId;
  }
};

const updateContactStatus = async (contactId, body) => {
  try {
    const contact = await Contact.findById(contactId);
    if (body.favorite !== contact.favorite) {
      contact.favorite = body.favorite;
      return await contact.save();
    }
  } catch (error) {
    console.error("Sorry! Status cannot be updated", error.message);
    return undefined;
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateContactStatus,
};
