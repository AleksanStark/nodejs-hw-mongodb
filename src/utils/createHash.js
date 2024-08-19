import { createHash } from 'crypto';

export const hash = (string) =>
  createHash('sha256').update(string).digest('hex');
