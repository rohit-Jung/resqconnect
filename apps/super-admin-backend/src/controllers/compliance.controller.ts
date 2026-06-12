import { cpComplianceConfig, cpOrganization } from '@repo/db/control-plane';

import { desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';

const COMPLIANCE_KEYS = [
  'hipaa',
  'cjis',
  'sessionTimeoutSeconds',
  'mfaRequired',
  'failedLoginLockoutEnabled',
  'failedLoginMaxAttempts',
  'failedLoginWindowSeconds',
  'failedLoginLockSeconds',
] as const;

type ComplianceInput = Record<string, unknown>;

/**
 * PUT /orgs/:id/compliance
 *
 * Updates the compliance config for an org.
 * Merges with existing config — only provided fields are changed.
 */
export const updateCompliance = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Org id is required' });
  }

  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, id),
    columns: { id: true },
  });
  if (!org) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  const input = (req.body ?? {}) as ComplianceInput;

  // Validate keys.
  for (const key of Object.keys(input)) {
    if (!COMPLIANCE_KEYS.includes(key as any)) {
      return res.status(400).json({
        ok: false,
        error: `Unknown compliance key: ${key}`,
        validKeys: COMPLIANCE_KEYS,
      });
    }
  }

  const existing = await db.query.cpComplianceConfig.findFirst({
    where: eq(cpComplianceConfig.cpOrgId, id),
    columns: { config: true, version: true },
    orderBy: [desc(cpComplianceConfig.version)],
  });

  const merged = {
    ...(existing?.config ?? {}),
    ...input,
  };

  const newVersion = (existing?.version ?? 0) + 1;

  await db
    .insert(cpComplianceConfig)
    .values({
      cpOrgId: id,
      config: merged as any,
      version: newVersion,
    })
    .onConflictDoUpdate({
      target: cpComplianceConfig.cpOrgId,
      set: {
        config: merged as any,
        version: newVersion,
        updatedAt: new Date(),
      },
    });

  return res.status(200).json({
    ok: true,
    version: newVersion,
    config: merged,
  });
};

/**
 * GET /orgs/:id/compliance
 *
 * Returns the current compliance config for an org.
 */
export const getCompliance = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Org id is required' });
  }
  const dbConfig = await db.query.cpComplianceConfig.findFirst({
    where: eq(cpComplianceConfig.cpOrgId, id),
    columns: { config: true, version: true, updatedAt: true },
    orderBy: [desc(cpComplianceConfig.version)],
  });

  return res.status(200).json({
    ok: true,
    snapshot: dbConfig
      ? {
          version: dbConfig.version,
          config: dbConfig.config,
          updatedAt: dbConfig.updatedAt,
        }
      : null,
  });
};
