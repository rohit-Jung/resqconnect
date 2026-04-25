import { getSectorConfig } from '@repo/config';

import type { NextFunction, Request, Response } from 'express';

import { envConfig } from '@/config';
import { verifyMfaTokenHeader } from '@/services/mfa.service';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';

// step-up mfa requirement for regulated sectors.
// expects a short-lived token in `x-mfa-token` header.
export const requireMfa = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Platform runtime is not sector-bound (no SECTOR env).
    if (envConfig.mode === 'platform') return next();

    const cfg = getSectorConfig();
    if (!cfg.compliance.mfaRequired) return next();

    const path = req.originalUrl ?? req.path;
    // allow mfa bootstrap endpoints.
    if (path.startsWith('/api/v1/mfa')) return next();

    // allow unauthenticated routes to proceed.
    if (!req.user?.id) return next();

    const token = (req.headers['x-mfa-token'] as string | undefined) ?? '';
    const ok = await verifyMfaTokenHeader({
      token,
      userId: req.user.id,
    });

    if (!ok) {
      throw new ApiError(403, 'MFA required');
    }

    next();
  }
);
