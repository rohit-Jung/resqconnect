import { asyncHandler } from '@repo/utils/api';

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { verifyAdminToken } from '@/utils/auth';
import { AppError } from '@/utils/errors';

export type AdminAuthContext = {
  admin: { id: string; email: string };
};

declare global {
  namespace Express {
    interface Request {
      auth?: AdminAuthContext;
    }
  }
}

export const requireAdminAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const [kind, token] = header.split(' ');
    if (kind?.toLowerCase() !== 'bearer' || !token) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    try {
      const payload = verifyAdminToken(token);
      req.auth = { admin: { id: payload.sub, email: payload.email } };
      next();
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  }
);
