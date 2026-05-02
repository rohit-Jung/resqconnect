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
      throw ApiError.unauthorized();
    }

    console.log(loggedIn);

    if (loggedIn.role !== 'organization') {
      // this guard is only for org endpoints.
      throw ApiError.forbidden('Not authorized');
    }

    // Fast path: token already marked restricted.
    if (loggedIn.restricted) {
      throw ApiError.forbidden('Organization access restricted');
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, loggedIn.id),
      columns: { lifecycleStatus: true },
    });

    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    if (org.lifecycleStatus !== 'active') {
      throw ApiError.forbidden('Organization access restricted');
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
      throw ApiError.unauthorized('Unauthorized');
    }

    if (loggedIn.role !== 'service_provider') {
      // This guard is only for provider endpoints.
      throw ApiError.forbidden('Not authorized');
    }

    // Fast path: token already marked restricted.
    if (loggedIn.restricted) {
      throw ApiError.forbidden('Organization access restricted');
    }

    const provider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedIn.id),
      columns: { organizationId: true },
    });

    if (!provider?.organizationId) {
      throw ApiError.notFound('Service provider not found');
    }

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, provider.organizationId),
      columns: { lifecycleStatus: true },
    });

    if (!org) {
      throw ApiError.notFound('Organization not found');
    }

    if (org.lifecycleStatus !== 'active') {
      throw ApiError.forbidden('Organization access restricted');
    }

    next();
  }
);
