import { organizationEntitlementsSnapshot } from '@repo/db/schemas';

import { desc, eq } from 'drizzle-orm';

import db from '@/db';
import { redis } from '@/services/redis.service';

export type OrgEntitlements = {
  provider_count_limit: number;
  api_rate_limit_tier: number; // max requests per 15 minutes
  notification_fallback_quota: number;
  analytics_enabled: boolean;
};

export const RESTRICTIVE_DEFAULT_ENTITLEMENTS: OrgEntitlements = {
  provider_count_limit: 0,
  api_rate_limit_tier: 15000,
  notification_fallback_quota: 0,
  analytics_enabled: false,
};

export async function getLatestOrgEntitlements(
  organizationId: string
): Promise<{ version: number; entitlements: OrgEntitlements } | null> {
  const latest = await db.query.organizationEntitlementsSnapshot.findFirst({
    where: eq(organizationEntitlementsSnapshot.organizationId, organizationId),
    columns: { version: true, entitlements: true },
    orderBy: [desc(organizationEntitlementsSnapshot.version)],
  });

  if (!latest) return null;

  // ensure required keys exist even if snapshot is partial.
  const raw = (latest.entitlements ?? {}) as Record<string, unknown>;
  return {
    version: latest.version,
    entitlements: {
      provider_count_limit: Number(raw.provider_count_limit ?? 0) || 0,
      api_rate_limit_tier: Number(raw.api_rate_limit_tier ?? 0) || 0,
      notification_fallback_quota:
        Number(raw.notification_fallback_quota ?? 0) || 0,
      analytics_enabled: Boolean(raw.analytics_enabled ?? false),
    },
  };
}

function monthBucketUtc(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}${m}`;
}

function ttlMsUntilNextUtcMonth(d: Date) {
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return Math.max(0, next.getTime() - d.getTime());
}

const FALLBACK_SMS_QUOTA_KEY = (organizationId: string, bucket: string) =>
  `org:${organizationId}:fallback_sms:${bucket}`;

type NotificationFallback = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  bucket: string;
};

// atomically consume org notification fallback sms quota.
// quota window: current utc month (resets at month boundary).
export async function consumeNotificationFallbackQuota(params: {
  organizationId: string;
  quantity?: number;
}): Promise<NotificationFallback> {
  const quantity = Math.max(1, Math.floor(params.quantity ?? 1));
  const now = new Date();
  const bucket = monthBucketUtc(now);
  const key = FALLBACK_SMS_QUOTA_KEY(params.organizationId, bucket);

  const latest = await getLatestOrgEntitlements(params.organizationId);
  const limit =
    latest?.entitlements.notification_fallback_quota ??
    RESTRICTIVE_DEFAULT_ENTITLEMENTS.notification_fallback_quota;

  const normalizedLimit = Math.max(0, Math.floor(limit || 0));
  if (normalizedLimit === 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      remaining: 0,
      bucket,
    };
  }

  const ttlMs = ttlMsUntilNextUtcMonth(now);

  // Lua script returns: {allowedFlag, newOrCurrentUsed}
  const script = `
    local current = redis.call('get', KEYS[1])
    local limit = tonumber(ARGV[1])
    local qty = tonumber(ARGV[2])
    local ttl = tonumber(ARGV[3])

    if not current then
      if qty > limit then
        return {0, 0}
      end
      redis.call('psetex', KEYS[1], ttl, tostring(qty))
      return {1, qty}
    end

    local used = tonumber(current)
    if not used then used = 0 end

    if (used + qty) > limit then
      return {0, used}
    end

    local nextUsed = redis.call('incrby', KEYS[1], qty)
    -- Ensure the key expires with the bucket even if it pre-existed without TTL.
    local pttl = redis.call('pttl', KEYS[1])
    if pttl < 0 then
      redis.call('pexpire', KEYS[1], ttl)
    end
    return {1, nextUsed}
  `;

  const result = (await (redis as any).eval(
    script,
    1,
    key,
    String(normalizedLimit),
    String(quantity),
    String(ttlMs)
  )) as [number, number] | null;

  const allowedFlag = Array.isArray(result) ? Number(result[0]) : 0;
  const used = Array.isArray(result) ? Number(result[1]) : 0;
  const remaining = Math.max(0, normalizedLimit - used);

  if (allowedFlag === 1) {
    return {
      allowed: true,
      used,
      limit: normalizedLimit,
      remaining,
      bucket,
    };
  }

  return {
    allowed: false,
    used,
    limit: normalizedLimit,
    remaining,
    bucket,
  };
}
