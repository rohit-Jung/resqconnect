import { getSectorConfig } from '@repo/config';

import type { NextFunction, Request, Response } from 'express';

import { envConfig } from '@/config';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';

// compliance session timeout: enforce max session age regardless of jwt exp.
export const enforceSessionTimeout = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Platform runtime is not sector-bound (no SECTOR env).
    if (envConfig.mode === 'platform') return next();

    const cfg = getSectorConfig();
    const seconds = cfg.compliance.sessionTimeoutSeconds;

    const u = req.user;
    if (!u) return next();

    // `iat` is seconds since epoch.
    if (typeof u.iat !== 'number') return next();

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds - u.iat > seconds) {
      throw ApiError.unauthorized('Session expired');
    }

    next();
  }
);
