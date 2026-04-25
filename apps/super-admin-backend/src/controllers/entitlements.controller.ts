import { cpOrgEntitlements } from '@repo/db/control-plane';
import { cpOrganization } from '@repo/db/control-plane';

import { desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { db } from '@/db';

export const getLatestEntitlements = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing org id' });
  }

  const latest = await db.query.cpOrgEntitlements.findFirst({
    where: eq(cpOrgEntitlements.cpOrgId, id),
    columns: { version: true, entitlements: true, createdAt: true },
    orderBy: [desc(cpOrgEntitlements.version)],
  });

  if (!latest) {
    return res
      .status(404)
      .json({ ok: false, error: 'No entitlements snapshot found' });
  }

  return res.status(200).json({ ok: true, snapshot: latest });
};

function parseBoolean(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
  return null;
}

function parseIntStrict(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw !== 'string') return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function normalizeEntitlements(input: unknown) {
  const src = (input ?? {}) as Record<string, unknown>;

  const providerCountLimit = parseIntStrict(src.provider_count_limit);
  const apiRateLimitTier = parseIntStrict(src.api_rate_limit_tier);
  const notificationFallbackQuota = parseIntStrict(
    src.notification_fallback_quota
  );
  const analyticsEnabled = parseBoolean(src.analytics_enabled);

  if (
    providerCountLimit === null ||
    apiRateLimitTier === null ||
    notificationFallbackQuota === null ||
    analyticsEnabled === null
  ) {
    return null;
  }

  return {
    provider_count_limit: Math.max(0, providerCountLimit),
    api_rate_limit_tier: Math.max(0, apiRateLimitTier),
    notification_fallback_quota: Math.max(0, notificationFallbackQuota),
    analytics_enabled: analyticsEnabled,
  };
}

export const setEntitlementsOverride = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing org id' });
  }

  const entitlements = normalizeEntitlements((req.body ?? {}).entitlements);
  if (!entitlements) {
    return res.status(400).json({
      ok: false,
      error:
        'Invalid entitlements. Expected provider_count_limit, api_rate_limit_tier, notification_fallback_quota, analytics_enabled',
    });
  }

  const pushToSiloRaw = (req.body ?? {}).pushToSilo;
  const pushToSilo = pushToSiloRaw === true;

  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, id as any),
    columns: { id: true, siloBaseUrl: true, siloOrgId: true },
  });

  if (!org) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  const latest = await db.query.cpOrgEntitlements.findFirst({
    where: eq(cpOrgEntitlements.cpOrgId, id as any),
    columns: { version: true },
    orderBy: [desc(cpOrgEntitlements.version)],
  });

  const nextVersion = (latest?.version ?? 0) + 1;

  const [created] = await db
    .insert(cpOrgEntitlements)
    .values({
      cpOrgId: id as any,
      version: nextVersion,
      entitlements,
    })
    .returning({
      version: cpOrgEntitlements.version,
      createdAt: cpOrgEntitlements.createdAt,
    });

  if (pushToSilo) {
    if (!org.siloBaseUrl || !org.siloOrgId) {
      return res.status(400).json({
        ok: false,
        error: 'Org not provisioned to silo yet',
      });
    }

    const entUrl = `${org.siloBaseUrl.replace(/\/$/, '')}/api/v1/internal/orgs/${org.siloOrgId}/entitlements`;
    const entRes = await fetch(entUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': envConfig.internal_api_key,
      },
      body: JSON.stringify({ version: nextVersion, entitlements }),
    });

    const text = await entRes.text().catch(() => '');
    if (!entRes.ok) {
      return res.status(502).json({
        ok: false,
        error: 'Entitlements updated in control plane, but push to silo failed',
        silo: { status: entRes.status, body: text },
        snapshot: created,
      });
    }
  }

  return res.status(200).json({
    ok: true,
    snapshot: created,
    version: nextVersion,
  });
};
