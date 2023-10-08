const { Contact } = require("./contact.model");

const listContacts = async (userId) => {
  try {
    const jsondata = await Contact.findOne({ owner: userId });
    // console.log(jsondata);
    return jsondata;
  } catch (error) {
    console.error("Error. Could not list contacts", error.message);
    throw "Cannot read contacts";
  }
};

const getContactById = async (contactId, userId) => {
  try {
    console.log("contactId", contactId, "userId", userId);
    const searchedContact = await Contact.findOne({
      _id: contactId,
      owner: userId,
    });
    console.log("searchedContact", searchedContact);
    return searchedContact;
  } catch {
    const message = "Cannot find contact with id " + contactId;
    console.error(message);
    return undefined;
  }
};

const removeContact = async (contactId, userId) => {
  try {
    const deletedContact = await Contact.deleteOne({
      _id: contactId,
      owner: userId,
    });
    return deletedContact;
  } catch (error) {
    console.error("Error. Could not delete contact", error.message);
    return undefined;
  }
};

const addContact = async (body, userId) => {
  try {
    const newContact = Contact.create({ ...body, owner: userId });
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
