import {
  cpOrgEntitlements,
  cpOrganization,
  cpSubscriptionPlan,
} from '@repo/db/control-plane';

import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';

/* ──────────────────────────────────────────
   Plan feature keys → entitlements mapping.
   A plan's `features` JSONB is an array of strings like:
     ["provider_limit:100", "analytics:true", "rate_limit:50000", "sms_quota:1000"]
   This service resolves them into the typed OrgEntitlements object
   and stores a versioned snapshot.
   ────────────────────────────────────────── */

export interface OrgEntitlements {
  provider_count_limit: number;
  api_rate_limit_tier: number;
  notification_fallback_quota: number;
  analytics_enabled: boolean;
}

const DEFAULTS: OrgEntitlements = {
  provider_count_limit: 0,
  api_rate_limit_tier: 15000,
  notification_fallback_quota: 0,
  analytics_enabled: false,
};

const FEATURE_MAP: Record<
  string,
  { key: keyof OrgEntitlements; type: 'number' | 'boolean' }
> = {
  provider_limit: { key: 'provider_count_limit', type: 'number' },
  rate_limit: { key: 'api_rate_limit_tier', type: 'number' },
  sms_quota: { key: 'notification_fallback_quota', type: 'number' },
  analytics: { key: 'analytics_enabled', type: 'boolean' },
};

export function computeEntitlementsFromPlanFeatures(
  features: string[]
): OrgEntitlements {
  return parseFeatures(features);
}

function parseFeatures(features: string[]): OrgEntitlements {
  const resolved = { ...DEFAULTS };

  for (const entry of features) {
    const [rawKey, rawVal] = entry.split(':').map(s => s.trim());
    const mapping = FEATURE_MAP[rawKey as keyof typeof FEATURE_MAP];
    if (!mapping) continue;

    if (mapping.type === 'number') {
      const num = Number(rawVal);
      if (Number.isFinite(num)) {
        (resolved as Record<string, unknown>)[mapping.key] = num;
      }
    } else if (mapping.type === 'boolean') {
      (resolved as Record<string, unknown>)[mapping.key] =
        rawVal === 'true' || rawVal === '1' || rawVal === 'yes';
    }
  }

  return resolved;
}

/* ──────────────────────────────────────────
   Resolve entitlements for an org based on its plan.
   Looks up the org's planId → plan features → compute → store snapshot.
   ────────────────────────────────────────── */

export async function resolveEntitlements(
  orgId: string
): Promise<{ version: number; entitlements: OrgEntitlements } | null> {
  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, orgId),
    columns: { planId: true },
  });

  if (!org) return null;

  // If no plan assigned, use restrictive defaults.
  if (!org.planId) {
    return await storeSnapshot(orgId, DEFAULTS);
  }

  const plan = await db.query.cpSubscriptionPlan.findFirst({
    where: eq(cpSubscriptionPlan.id, org.planId),
    columns: { features: true },
  });

  if (!plan) {
    return await storeSnapshot(orgId, DEFAULTS);
  }

  const entitlements = parseFeatures(plan.features);
  return await storeSnapshot(orgId, entitlements);
}

async function storeSnapshot(
  orgId: string,
  entitlements: OrgEntitlements
): Promise<{ version: number; entitlements: OrgEntitlements }> {
  // Find current version.
  const latest = await db.query.cpOrgEntitlements.findFirst({
    where: eq(cpOrgEntitlements.cpOrgId, orgId),
    columns: { version: true },
    orderBy: [cpOrgEntitlements.version as any],
  });

  const version = (latest?.version ?? 0) + 1;

  await db.insert(cpOrgEntitlements).values({
    cpOrgId: orgId,
    version,
    entitlements: entitlements as any,
  });

  return { version, entitlements };
}

/* ──────────────────────────────────────────
   Push computed entitlements to the silo.
   ────────────────────────────────────────── */

export async function pushEntitlementsToSilo(
  orgId: string,
  siloBaseUrl: string,
  siloOrgId: string
): Promise<boolean> {
  const snapshot = await db.query.cpOrgEntitlements.findFirst({
    where: eq(cpOrgEntitlements.cpOrgId, orgId),
    columns: { version: true, entitlements: true },
    orderBy: [cpOrgEntitlements.version as any],
  });

  if (!snapshot) return false;

  const url = `${siloBaseUrl.replace(/\/$/, '')}/api/v1/internal/orgs/${siloOrgId}/entitlements`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_API_KEY ?? '',
      },
      body: JSON.stringify({
        version: snapshot.version,
        entitlements: snapshot.entitlements,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/* ──────────────────────────────────────────
   Seed default plans (call from an admin endpoint).
   ────────────────────────────────────────── */

export const DEFAULT_PLANS = [
  {
    name: 'Starter',
    price: 0,
    durationMonths: 0,
    features: [
      'provider_limit:25',
      'rate_limit:10000',
      'sms_quota:100',
      'analytics:false',
    ],
  },
  {
    name: 'Professional',
    price: 0,
    durationMonths: 0,
    features: [
      'provider_limit:100',
      'rate_limit:50000',
      'sms_quota:1000',
      'analytics:true',
    ],
  },
  {
    name: 'Enterprise',
    price: 0,
    durationMonths: 0,
    features: [
      'provider_limit:-1',
      'rate_limit:200000',
      'sms_quota:5000',
      'analytics:true',
    ],
  },
];

export async function seedDefaultPlans(): Promise<void> {
  for (const plan of DEFAULT_PLANS) {
    const existing = await db.query.cpSubscriptionPlan.findFirst({
      where: eq(cpSubscriptionPlan.name, plan.name),
      columns: { id: true },
    });
    if (existing) continue;

    await db.insert(cpSubscriptionPlan).values({
      name: plan.name,
      price: plan.price,
      durationMonths: plan.durationMonths,
      features: plan.features,
      isActive: true,
    });
  }
}
