import type { NextFunction, Request, Response } from 'express';

import type { TUserRole } from '@/models';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

const validateServiceProvider = asyncHandler(
  async function validateServiceProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded || decoded == null) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = decoded;
    next();
  }
);

const validateRoleAuth = (allowedRoles: TUserRole[]) => {
  return asyncHandler(async (req: Request, _, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded || decoded == null) {
      next();
      return;
    }

    if (!allowedRoles.includes(decoded.role as TUserRole)) {
      throw new ApiError(401, 'Not authorized to perform this action');
    }

    req.user = decoded;
    next();
  });
};

const validateOrg = asyncHandler(
  async (req: Request, _, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = await verifyAndDecodeToken(token);
    console.log('Decoded', decoded);
    if (!decoded || decoded == null) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = decoded;
    next();
  }
);

export { validateServiceProvider, validateRoleAuth, validateOrg };
