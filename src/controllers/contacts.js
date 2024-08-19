import {
  createContact,
  deleteContact,
  getAllContacts,
  getContactById,
  updateContact,
} from '../services/contacts.js';
import createHttpError from 'http-errors';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { env } from '../utils/env.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
export const getAllContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortOrder, sortBy } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  const userId = req.user._id;
  const contacts = await getAllContacts({
    page,
    perPage,
    sortOrder,
    sortBy,
    filter,
    userId,
  });
  res.status(200).json({
    status: 200,
    message: 'uccessfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  const { _id } = req.user;
  const { contactId } = req.params;
  const contact = await getContactById(_id, contactId);

  if (!contact) {
    throw createHttpError(404, 'Contact not Found');
  }

  res.status(200).json({
    status: 200,
    message: 'Successfully found contact with id {**contactId**}!',
    data: contact,
  });
};

export const createContactController = async (req, res) => {
  const contact = await createContact(req.body, req.user._id);

  res.status(201).json({
    status: 201,
    message: 'Successfully created contact',
    data: contact,
  });
};

export const updateContactController = async (req, res) => {
  const { _id } = req.user;
  const { contactId } = req.params;
  const photo = req.file;
  let photoUrl;

  if (photo) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      photoUrl = await saveFileToUploadDir(photo);
    }
  }

  const result = await updateContact(_id, contactId, {
    ...req.body,
    photo: photoUrl,
  });

  if (!result) {
    throw createHttpError(404, 'Contact not found');
  }

  const status = result.isNew ? 201 : 200;

  res.status(status).json({
    status,
    message: 'Successfully upserted a contact!',
    data: result.contact,
  });
};

export const deleteContactController = async (req, res) => {
  const { _id } = req.user;
  const { contactId } = req.params;
  const contact = await deleteContact(_id, contactId);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).json({
    status: 204,
    message: 'Successfully deleted contact',
    data: contact,
  });
};
