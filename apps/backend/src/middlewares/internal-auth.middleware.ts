import type { NextFunction, Request, Response } from 'express';

import { envConfig } from '@/config';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';

// Simple header-key auth for internal endpoints.
// If INTERNAL_API_KEY is not set, we default to denying access.
export const requireInternalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const expected = envConfig.internal_api_key;
    if (!expected) {
      throw new ApiError(503, 'Internal API not configured');
    }

    const provided = req.header('x-internal-api-key');
    if (!provided || provided !== expected) {
      throw new ApiError(401, 'Unauthorized');
    }

    next();
  }
);
