import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';

import { UserRoles } from '@/constants';
import { getAutoComplete, getRoute } from '@/controllers/maps.controller';
import {
  validateRoleAuth,
  validateServiceProvider,
} from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

const mapsRouter = Router();

// Middleware that allows both users and service providers
const validateUserOrProvider = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  }
);

mapsRouter
  .route('/autocomplete')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), getAutoComplete);

// POST method since we use req.body for origin/dest - accessible by users and service providers
mapsRouter.route('/optimal-route').post(validateUserOrProvider, getRoute);

export default mapsRouter;
