import { userCollection } from '../db/models/user.js';

export const registerUser = async (payload) => {
  return await userCollection.create(payload);
};
