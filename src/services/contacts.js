import { contactCollection } from '../db/model/contact.js';

export const getAllContacts = async () => {
  const contacts = await contactCollection.find();
  return contacts;
};

export const getContactById = async (contactId) => {
  const contact = await contactCollection.findById(contactId);
  return contact;
};
