import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import { getTenantConfig } from '@/controllers/tenants.controller';
import { requireInternalAuth } from '@/middlewares/internal-auth.middleware';

export const tenantsRouter = Router();

tenantsRouter.get(
  '/:tenantId/config',
  requireInternalAuth,
  asyncHandler(getTenantConfig)
);
