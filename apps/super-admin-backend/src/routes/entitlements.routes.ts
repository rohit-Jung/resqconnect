import { Router } from 'express';

import {
  getLatestEntitlements,
  setEntitlementsOverride,
} from '@/controllers/entitlements.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';
import { asyncHandler } from '@/utils/async-handler';

export const entitlementsRouter = Router();

entitlementsRouter.get(
  '/orgs/:id/entitlements',
  requireAdminAuth,
  asyncHandler(getLatestEntitlements)
);

entitlementsRouter.post(
  '/orgs/:id/entitlements',
  requireAdminAuth,
  asyncHandler(setEntitlementsOverride)
);
