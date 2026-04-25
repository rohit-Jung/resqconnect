import type { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';

// minimal RBAC: keep it simple and deterministic.
// this is not a full permissions system; it just enforces high-risk prefixes.
const ADMIN_ONLY_PREFIXES = ['/api/v1/admin'];

export const enforceRbac = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role?.toString();
    if (!role) return next();

    const path = req.originalUrl ?? req.path;
    if (ADMIN_ONLY_PREFIXES.some(p => path.startsWith(p))) {
      if (role !== 'admin') throw new ApiError(403, 'Not authorized');
    }

    next();
  }
);
