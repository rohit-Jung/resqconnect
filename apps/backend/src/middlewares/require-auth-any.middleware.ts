import type { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

// Enforces authentication for any actor type.
export const requireAuthenticatedAny = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token =
      (req.cookies?.token as string | undefined) ||
      (req.headers.authorization?.replace('Bearer ', '') as string | undefined);

    if (!token) throw new ApiError(401, 'Authentication token required');

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded) throw new ApiError(401, 'Invalid or expired token');

    req.user = decoded;
    next();
  }
);
