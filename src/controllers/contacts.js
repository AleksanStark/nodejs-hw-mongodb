import { getAllContacts, getContactById } from '../services/contacts.js';

export const getAllContactsController = async (req, res, next) => {
  try {
    const contacts = await getAllContacts();
    res.status(200).json({
      status: 200,
      message: 'uccessfully found contacts!',
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
};

export const getContactByIdController = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await getContactById(contactId);

    if (!contact) {
      res.status(404).json({
        message: 'Contact not found',
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully found contact with id {**contactId**}!',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};
