import { Router } from 'express';

import {
  getLatestEntitlements,
  setEntitlementsOverride,
} from '@/controllers/entitlements.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const entitlementsRouter = Router();

// Minimal public/admin API to inspect latest entitlements.
entitlementsRouter.get(
  '/orgs/:id/entitlements',
  requireAdminAuth,
  getLatestEntitlements
);

// Admin override: write a new entitlements snapshot (optionally pushes to silo).
entitlementsRouter.post(
  '/orgs/:id/entitlements',
  requireAdminAuth,
  setEntitlementsOverride
);
