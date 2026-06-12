import { cpComplianceConfig, cpOrganization } from '@repo/db/control-plane';

import { desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';

const SECTOR_COMPLIANCE = {
  fire: {
    hipaa: false,
    cjis: false,
    sessionTimeoutSeconds: 3600,
    mfaRequired: false,
    failedLoginLockoutEnabled: false,
    failedLoginMaxAttempts: 5,
    failedLoginWindowSeconds: 600,
    failedLoginLockSeconds: 900,
  },
  hospital: {
    hipaa: true,
    cjis: false,
    sessionTimeoutSeconds: 1800,
    mfaRequired: true,
    failedLoginLockoutEnabled: false,
    failedLoginMaxAttempts: 5,
    failedLoginWindowSeconds: 600,
    failedLoginLockSeconds: 900,
  },
  police: {
    hipaa: false,
    cjis: true,
    sessionTimeoutSeconds: 900,
    mfaRequired: true,
    failedLoginLockoutEnabled: true,
    failedLoginMaxAttempts: 5,
    failedLoginWindowSeconds: 600,
    failedLoginLockSeconds: 900,
  },
} as const;

type SectorKey = keyof typeof SECTOR_COMPLIANCE;
type ComplianceShape = {
  hipaa: boolean;
  cjis: boolean;
  sessionTimeoutSeconds: number;
  mfaRequired: boolean;
  failedLoginLockoutEnabled: boolean;
  failedLoginMaxAttempts: number;
  failedLoginWindowSeconds: number;
  failedLoginLockSeconds: number;
};

/**
 * GET /internal/tenants/:tenantId/config
 */
export const getTenantConfig = async (req: Request, res: Response) => {
  const tenantId =
    typeof req.params?.tenantId === 'string' ? req.params.tenantId : '';
  if (!tenantId)
    return res.status(400).json({ ok: false, error: 'tenantId is required' });

  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, tenantId),
    columns: {
      id: true,
      sector: true,
      status: true,
      siloBaseUrl: true,
      databaseUrl: true,
    },
  });
  if (!org)
    return res.status(404).json({ ok: false, error: 'Tenant not found' });
  if (org.status !== 'active') {
    return res
      .status(403)
      .json({ ok: false, error: `Tenant not active (${org.status})` });
  }

  const sectorDefaults = SECTOR_COMPLIANCE[org.sector as SectorKey];
  if (!sectorDefaults)
    return res
      .status(500)
      .json({ ok: false, error: `Unknown sector: ${org.sector}` });

  const dbConfig = await db.query.cpComplianceConfig.findFirst({
    where: eq(cpComplianceConfig.cpOrgId, tenantId),
    columns: { config: true, version: true },
    orderBy: [desc(cpComplianceConfig.version)],
  });

  const cfg = dbConfig?.config;
  const compliance: ComplianceShape = cfg
    ? {
        hipaa:
          typeof cfg.hipaa === 'boolean' ? cfg.hipaa : sectorDefaults.hipaa,
        cjis: typeof cfg.cjis === 'boolean' ? cfg.cjis : sectorDefaults.cjis,
        sessionTimeoutSeconds:
          typeof cfg.sessionTimeoutSeconds === 'number'
            ? cfg.sessionTimeoutSeconds
            : sectorDefaults.sessionTimeoutSeconds,
        mfaRequired:
          typeof cfg.mfaRequired === 'boolean'
            ? cfg.mfaRequired
            : sectorDefaults.mfaRequired,
        failedLoginLockoutEnabled:
          typeof cfg.failedLoginLockoutEnabled === 'boolean'
            ? cfg.failedLoginLockoutEnabled
            : sectorDefaults.failedLoginLockoutEnabled,
        failedLoginMaxAttempts:
          typeof cfg.failedLoginMaxAttempts === 'number'
            ? cfg.failedLoginMaxAttempts
            : sectorDefaults.failedLoginMaxAttempts,
        failedLoginWindowSeconds:
          typeof cfg.failedLoginWindowSeconds === 'number'
            ? cfg.failedLoginWindowSeconds
            : sectorDefaults.failedLoginWindowSeconds,
        failedLoginLockSeconds:
          typeof cfg.failedLoginLockSeconds === 'number'
            ? cfg.failedLoginLockSeconds
            : sectorDefaults.failedLoginLockSeconds,
      }
    : { ...sectorDefaults };

  return res.status(200).json({
    ok: true,
    data: {
      tenantId: org.id,
      sector: org.sector,
      compliance,
      complianceVersion: dbConfig?.version ?? null,
      databaseUrl: org.databaseUrl ?? null,
    },
  });
};
