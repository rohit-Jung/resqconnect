import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { envConfig } from '@/config';

export type AdminJwtPayload = {
  sub: string;
  email: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAdminToken(payload: AdminJwtPayload) {
  return jwt.sign(payload, envConfig.jwt_secret, {
    expiresIn: envConfig.jwt_expiry,
  });
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, envConfig.jwt_secret) as AdminJwtPayload;
}
