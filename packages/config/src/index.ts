import z from 'zod';

import {
  type Sector,
  type SectorConfig,
  baseSectorConfig,
  sectorOverrides,
} from './sectors';
import type { TenantConfig } from './tenants';

const sectorEnvSchema = z.object({
  SECTOR: z.enum(['fire', 'hospital', 'police']).default('fire'),
});

const tenantEnvSchema = z.object({
  TENANT_ID: z.string().uuid().optional(),
  CONTROL_PANE_URL: z.string().optional(),
});

let cached: SectorConfig | null = null;
let cachedTenant: TenantConfig | null = null;

// Legacy: sector-based config (fallback)

function loadSectorConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): SectorConfig {
  const parsed = sectorEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error('Invalid SECTOR environment variable');
  }

  const sector = parsed.data.SECTOR as Sector;
  const overrides = sectorOverrides[sector];

  return {
    sector,
    compliance: {
      ...baseSectorConfig.compliance,
      ...overrides.compliance,
    },
  };
}

export function getSectorConfig(): SectorConfig {
  // If a tenant config was loaded (from TENANT_ID), return that.
  if (cachedTenant) return cachedTenant;
  if (!cached) cached = loadSectorConfigFromEnv();
  return cached;
}

// Tenant-based config (primary path)

async function fetchTenantConfigFromCp(
  tenantId: string,
  cpUrl: string
): Promise<TenantConfig> {
  const url = `${cpUrl.replace(/\/$/, '')}/internal/tenants/${tenantId}/config`;

  const res = await fetch(url, {
    headers: {
      'x-internal-api-key': process.env.INTERNAL_API_KEY ?? '',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch tenant config: ${res.status} ${text}`);
  }

  const json = (await res.json()) as Record<string, unknown>;
  const data = (json?.data ?? json) as Record<string, unknown>;
  const compliance = (data as any).compliance ?? {};

  return {
    tenantId,
    sector: data.sector as Sector,
    compliance: {
      hipaa: compliance.hipaa ?? false,
      cjis: compliance.cjis ?? false,
      sessionTimeoutSeconds: compliance.sessionTimeoutSeconds ?? 3600,
      mfaRequired: compliance.mfaRequired ?? false,
      failedLoginLockoutEnabled: compliance.failedLoginLockoutEnabled ?? false,
      failedLoginMaxAttempts: compliance.failedLoginMaxAttempts ?? 5,
      failedLoginWindowSeconds: compliance.failedLoginWindowSeconds ?? 600,
      failedLoginLockSeconds: compliance.failedLoginLockSeconds ?? 900,
    },
  };
}

export async function loadTenantConfig(
  env: NodeJS.ProcessEnv = process.env
): Promise<TenantConfig | SectorConfig> {
  const parsed = tenantEnvSchema.safeParse(env);
  const tenantId = parsed.success ? parsed.data.TENANT_ID : undefined;
  const cpUrl = parsed.success ? parsed.data.CONTROL_PANE_URL : undefined;

  // If TENANT_ID + CONTROL_PANE_URL are set, fetch from CP.
  // This is the primary path for multi-tenant silos.
  if (tenantId && cpUrl) {
    const config = await fetchTenantConfigFromCp(tenantId, cpUrl);
    cachedTenant = config;
    return config;
  }

  // Fallback: use SECTOR env var (legacy path).
  return loadSectorConfigFromEnv(env);
}

export async function getTenantConfig(
  env: NodeJS.ProcessEnv = process.env
): Promise<TenantConfig | SectorConfig> {
  if (cachedTenant) return cachedTenant;
  if (cached) return cached;
  return loadTenantConfig(env);
}

// Re-exports

export type { Sector, SectorConfig } from './sectors';
export type { TenantConfig } from './tenants';
