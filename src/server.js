import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import { env } from './utils/env.js';
import {
  getAllContactsController,
  getContactByIdController,
} from './controllers/contacts.js';

const PORT = Number(env('PORT', '3000'));

export const stetupServer = () => {
  const app = express();

  app.use(express.json());
  app.use(pino());
  app.use(cors());

  app.get('/contacts', getAllContactsController);
  app.get('/contacts/:contactId', getContactByIdController);

  app.use('*', (req, res, next) => {
    res.status(404).json({ message: 'Not found' });
  });

  app.use((req, res, next) => {
    res.status(500).json({ message: 'Internal Server Error!' });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
};
