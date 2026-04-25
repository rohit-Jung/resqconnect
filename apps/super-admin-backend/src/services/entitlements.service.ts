type Entitlements = {
  provider_count_limit: number;
  api_rate_limit_tier: number; // max requests per 15 minutes
  notification_fallback_quota: number;
  analytics_enabled: boolean;
};

function parseBoolean(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

function parseIntStrict(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) throw new Error(`Invalid number: ${raw}`);
  return n;
}

// Parse key=value strings from subscription_plans.features.
// Only whitelisted entitlements are extracted; others are ignored.
export function computeEntitlementsFromPlanFeatures(
  features: string[]
): Entitlements {
  // Restrictive defaults (missing keys mean no entitlement).
  const ent: Entitlements = {
    provider_count_limit: 0,
    api_rate_limit_tier: 0,
    notification_fallback_quota: 0,
    analytics_enabled: false,
  };

  for (const item of features ?? []) {
    if (typeof item !== 'string') continue;
    const idx = item.indexOf('=');
    if (idx <= 0) continue;
    const key = item.slice(0, idx).trim();
    const value = item.slice(idx + 1).trim();

    try {
      switch (key) {
        case 'provider_count_limit':
          ent.provider_count_limit = Math.max(0, parseIntStrict(value));
          break;
        case 'api_rate_limit_tier':
          ent.api_rate_limit_tier = Math.max(0, parseIntStrict(value));
          break;
        case 'notification_fallback_quota':
          ent.notification_fallback_quota = Math.max(0, parseIntStrict(value));
          break;
        case 'analytics_enabled':
          ent.analytics_enabled = parseBoolean(value);
          break;
        default:
          break;
      }
    } catch {
      // Ignore malformed feature values.
    }
  }

  return ent;
}
