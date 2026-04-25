import crypto from 'node:crypto';

import { redis } from '@/services/redis.service';

const MFA_TOKEN_TTL_SECONDS = 300;

const mfaKey = (userId: string) => `mfa:${userId}`;

export async function issueMfaToken(params: {
  userId: string;
}): Promise<string> {
  const token = crypto.randomBytes(24).toString('hex');
  await redis.set(mfaKey(params.userId), token, 'EX', MFA_TOKEN_TTL_SECONDS);
  return token;
}

export async function verifyMfaTokenHeader(params: {
  userId: string;
  token: string;
}): Promise<boolean> {
  if (!params.token) return false;
  const expected = await redis.get(mfaKey(params.userId));
  return expected != null && expected === params.token;
}
