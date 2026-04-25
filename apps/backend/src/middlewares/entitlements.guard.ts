import {
  organizationEntitlementsSnapshot,
  serviceProvider,
} from '@repo/db/schemas';

import { count, desc, eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

import db from '@/db';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';

type Entitlements = {
  provider_count_limit: number;
  api_rate_limit_tier: number;
  notification_fallback_quota: number;
  analytics_enabled: boolean;
};

const RESTRICTIVE_DEFAULT: Entitlements = {
  provider_count_limit: 0,
  api_rate_limit_tier: 0,
  notification_fallback_quota: 0,
  analytics_enabled: false,
};

async function loadEntitlements(orgId: string): Promise<Entitlements> {
  const latest = await db.query.organizationEntitlementsSnapshot.findFirst({
    where: eq(organizationEntitlementsSnapshot.organizationId, orgId),
    columns: { entitlements: true },
    orderBy: [desc(organizationEntitlementsSnapshot.version)],
  });

  if (!latest) return RESTRICTIVE_DEFAULT;

  const raw = (latest.entitlements ?? {}) as Record<string, unknown>;
  return {
    provider_count_limit: Number(raw.provider_count_limit ?? 0) || 0,
    api_rate_limit_tier: Number(raw.api_rate_limit_tier ?? 0) || 0,
    notification_fallback_quota:
      Number(raw.notification_fallback_quota ?? 0) || 0,
    analytics_enabled: Boolean(raw.analytics_enabled ?? false),
  };
}

export const requireAnalyticsEnabled = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const loggedIn = req.user;
    if (!loggedIn?.id || loggedIn.role !== 'organization') {
      throw new ApiError(403, 'Not authorized');
    }

    const ent = await loadEntitlements(loggedIn.id);
    if (!ent.analytics_enabled) {
      throw new ApiError(403, 'Analytics not enabled for this organization');
    }
    next();
  }
);

// Enforce provider_count_limit before provider creation routes.
export const enforceProviderCountLimit = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const loggedIn = req.user;
    if (!loggedIn?.id || loggedIn.role !== 'organization') {
      throw new ApiError(403, 'Not authorized');
    }

    const ent = await loadEntitlements(loggedIn.id);
    const limit = ent.provider_count_limit;
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new ApiError(
        403,
        'Provider registration is not enabled for this organization'
      );
    }

    const rows = await db
      .select({ c: count() })
      .from(serviceProvider)
      .where(eq(serviceProvider.organizationId, loggedIn.id));
    const current = rows[0]?.c ?? 0;

    if (current >= limit) {
      throw new ApiError(403, `Provider limit reached (${limit})`);
    }

    next();
  }
);
