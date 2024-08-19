import createHttpError from 'http-errors';
import { userCollection } from '../db/models/user.js';
import bcrypt from 'bcrypt';
import { sessionCollection } from '../db/models/session.js';
import { randomBytes } from 'crypto';
import {
  FIFTEEN_MINUTES,
  ONE_DAY,
  SMTP,
  TEMPLATES_DIR,
} from '../constants/index.js';
import jwt from 'jsonwebtoken';
import { hash } from '../utils/createHash.js';
import { env } from '../utils/env.js';
import { sendEmail } from '../utils/sendMail.js';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import { Console } from 'console';

const jwt_secret = hash(env('JWT_SECRET'));

export const registerUser = async (payload) => {
  const user = await userCollection.findOne({ email: payload.email });
  if (user) throw createHttpError(409, 'Email in use');

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  return await userCollection.create({
    ...payload,
    password: encryptedPassword,
  });
};

export const loginUser = async (payload) => {
  const user = await userCollection.findOne({ email: payload.email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }
  const isEqual = await bcrypt.compare(payload.password, user.password);

  if (!isEqual) {
    throw createHttpError(401, 'Unauthorized');
  }

  await sessionCollection.deleteOne({ userId: user.id });

  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return await sessionCollection.create({
    userId: user.id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
};

export const logoutUser = async (sessionId) => {
  await sessionCollection.deleteOne({ _id: sessionId });
};

export const createSession = () => {
  const accessToken = randomBytes(30).toString('base64');
  const refreshToken = randomBytes(30).toString('base64');

  return {
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  };
};

export const refreshUserSession = async ({ sessionId, refreshToken }) => {
  const session = await sessionCollection.findOne({
    _id: sessionId,
    refreshToken,
  });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  const newSession = createSession();

  await sessionCollection.deleteOne({ _id: sessionId, refreshToken });

  return await sessionCollection.create({
    userId: session.userId,
    ...newSession,
  });
};

export const requestResetToken = async (email) => {
  const user = await userCollection.findOne({ email });

  if (!user) {
    throw createHttpError(404, 'User not found!');
  }
  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    jwt_secret,
    { expiresIn: '15m' },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${env('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  try {
    await sendEmail({
      from: env(SMTP.SMTP_FROM),
      to: email,
      subject: 'Reset Your password',
      html,
    });
  } catch (err) {
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }
};

export const resetPassword = async (password, token) => {
  let entries;
  try {
    entries = jwt.verify(token, jwt_secret);
    console.log(entries);
  } catch (err) {
    if (err instanceof Error) throw createHttpError(401, err.message);
    throw err;
  }

  const user = await userCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) throw createHttpError(404, 'User not found');

  const encryptedPassword = await bcrypt.hash(password, 10);

  await userCollection.updateOne(
    {
      _id: user._id,
    },
    { password: encryptedPassword },
  );
};
