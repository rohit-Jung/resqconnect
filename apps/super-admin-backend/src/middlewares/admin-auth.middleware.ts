import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { verifyAdminToken } from '@/utils/auth';

export type AdminAuthContext = {
  admin: {
    id: string;
    email: string;
  };
};

function bearerToken(req: Request) {
  const header = req.header('authorization') ?? '';
  const [kind, token] = header.split(' ');
  if (kind?.toLowerCase() !== 'bearer') return null;
  return token || null;
}

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing bearer token' });
  }

  try {
    const payload = verifyAdminToken(token);
    (req as any).auth = {
      admin: {
        id: payload.sub,
        email: payload.email,
      },
    } satisfies AdminAuthContext;
    return next();
  } catch (err) {
    const isExpired =
      err instanceof jwt.TokenExpiredError ||
      (typeof err === 'object' &&
        err !== null &&
        (err as any).name === 'TokenExpiredError');
    return res.status(401).json({
      ok: false,
      error: isExpired ? 'Token expired' : 'Invalid token',
    });
  }
}
