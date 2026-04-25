import { organization, serviceProvider } from '@repo/db/schemas';

import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

import db from '@/db';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';

// blocks org-only operational endpoints unless org lifecycle status is 'active'.
// login is still allowed and issues a restricted jwt when inactive.
export const requireActiveOrganization = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const loggedIn = req.user;

    if (!loggedIn?.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    console.log(loggedIn);

    if (loggedIn.role !== 'organization') {
      // this guard is only for org endpoints.
      throw new ApiError(403, 'Not authorized');
    }

    // Fast path: token already marked restricted.
    if (loggedIn.restricted) {
      throw new ApiError(403, 'Organization access restricted');
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, loggedIn.id),
      columns: { lifecycleStatus: true },
    });

    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.lifecycleStatus !== 'active') {
      throw new ApiError(403, 'Organization access restricted');
    }

    next();
  }
);

// Blocks provider operational endpoints unless provider's org lifecycle status is 'active'.
// Provider login is still allowed and may issue a restricted JWT.
export const requireActiveProviderOrganization = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const loggedIn = req.user;

    if (!loggedIn?.id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (loggedIn.role !== 'service_provider') {
      // This guard is only for provider endpoints.
      throw new ApiError(403, 'Not authorized');
    }

    // Fast path: token already marked restricted.
    if (loggedIn.restricted) {
      throw new ApiError(403, 'Organization access restricted');
    }

    const provider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedIn.id),
      columns: { organizationId: true },
    });

    if (!provider?.organizationId) {
      throw new ApiError(404, 'Service provider not found');
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, provider.organizationId),
      columns: { lifecycleStatus: true },
    });

    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (org.lifecycleStatus !== 'active') {
      throw new ApiError(403, 'Organization access restricted');
    }

    next();
  }
);
