import { cpOrganization, cpSiloRegistry } from '@repo/db/control-plane';
import { emergencyRequest, organization } from '@repo/db/schemas';

import { and, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { db } from '@/db';

/* ──────────────────────────────────────────
   POST /internal/silos/register
   Called by a silo on boot. Registers or updates the silo's presence,
   reconciles orgs, and stores incident + metrics snapshots.
   ────────────────────────────────────────── */

export const registerSilo = async (req: Request, res: Response) => {
  const { tenantId, siloBaseUrl, sector, orgs, incidentSummary } = (req.body ??
    {}) as {
    tenantId?: string;
    siloBaseUrl?: string;
    sector?: string;
    orgs?: Array<{ id: string; name: string }>;
    incidentSummary?: {
      total?: number;
      pending?: number;
      active?: number;
      completed?: number;
      cancelled?: number;
    };
  };

  if (typeof siloBaseUrl !== 'string' || typeof sector !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'siloBaseUrl and sector are required',
    });
  }

  // If tenantId is provided, update the cp_organization record's siloBaseUrl.
  if (typeof tenantId === 'string' && tenantId.length > 0) {
    await db
      .update(cpOrganization)
      .set({ siloBaseUrl })
      .where(eq(cpOrganization.id, tenantId));
  }

  const VALID_SECTORS = ['hospital', 'police', 'fire'] as const;
  if (!VALID_SECTORS.includes(sector as any)) {
    return res.status(400).json({
      ok: false,
      error: `Invalid sector "${sector}". Must be one of: ${VALID_SECTORS.join(', ')}`,
    });
  }

  const now = new Date();

  // Upsert silo registry entry.
  await db
    .insert(cpSiloRegistry)
    .values({
      siloBaseUrl,
      sector,
      status: 'active',
      orgCount: orgs?.length ?? 0,
      orgs: orgs ?? [],
      incidentSummary: {
        total: incidentSummary?.total ?? 0,
        pending: incidentSummary?.pending ?? 0,
        active: incidentSummary?.active ?? 0,
        completed: incidentSummary?.completed ?? 0,
        cancelled: incidentSummary?.cancelled ?? 0,
      },
      synced: true,
      lastHeartbeat: now,
      lastSyncAt: now,
    })
    .onConflictDoUpdate({
      target: cpSiloRegistry.siloBaseUrl,
      set: {
        sector,
        status: 'active',
        orgCount: orgs?.length ?? 0,
        orgs: orgs ?? [],
        incidentSummary: {
          total: incidentSummary?.total ?? 0,
          pending: incidentSummary?.pending ?? 0,
          active: incidentSummary?.active ?? 0,
          completed: incidentSummary?.completed ?? 0,
          cancelled: incidentSummary?.cancelled ?? 0,
        },
        synced: true,
        lastHeartbeat: now,
        lastSyncAt: now,
        updatedAt: now,
      },
    });

  // Reconcile orgs: for each org the silo reports, ensure a cp_organization
  // entry exists. If one doesn't, create it.
  const reconciledOrgs: Array<{ siloOrgId: string; cpOrgId: string }> = [];

  if (orgs && orgs.length > 0) {
    for (const org of orgs) {
      const existing = await db.query.cpOrganization.findFirst({
        where: and(
          eq(cpOrganization.siloBaseUrl, siloBaseUrl),
          eq(cpOrganization.siloOrgId, org.id)
        ),
        columns: { id: true },
      });

      if (existing?.id) {
        reconciledOrgs.push({
          siloOrgId: org.id,
          cpOrgId: String(existing.id),
        });
      } else {
        // Orphan org — create a cp_organization entry for it.
        const [created] = await db
          .insert(cpOrganization)
          .values({
            name: org.name,
            sector: sector as any,
            status: 'active',
            siloBaseUrl,
            siloOrgId: org.id,
          })
          .onConflictDoNothing()
          .returning({ id: cpOrganization.id });

        if (created?.id) {
          reconciledOrgs.push({
            siloOrgId: org.id,
            cpOrgId: String(created.id),
          });
        }
      }
    }
  }

  return res.status(200).json({
    ok: true,
    silo: { siloBaseUrl, sector, status: 'active' },
    reconciledOrgs,
    synced: true,
  });
};

/* ──────────────────────────────────────────
   GET /internal/silos
   Lists all registered silos.
   ────────────────────────────────────────── */

export const listActiveSilos = async (req: Request, res: Response) => {
  const silos = await db.query.cpSiloRegistry.findMany({
    where: eq(cpSiloRegistry.status, 'active'),
    columns: {
      siloBaseUrl: true,
      sector: true,
      orgCount: true,
      incidentSummary: true,
      lastHeartbeat: true,
    },
    orderBy: [cpSiloRegistry.sector],
  });

  return res.status(200).json({ ok: true, silos });
};

export const listSilos = async (req: Request, res: Response) => {
  const silos = await db.query.cpSiloRegistry.findMany({
    orderBy: (s, { desc }) => [desc(s.lastHeartbeat)],
  });

  return res.status(200).json({ ok: true, silos });
};

/* ──────────────────────────────────────────
   GET /internal/silos/:siloBaseUrl
   Returns detailed info for one silo.
   ────────────────────────────────────────── */

export const getSilo = async (req: Request, res: Response) => {
  const siloBaseUrl =
    typeof req.params?.siloBaseUrl === 'string'
      ? decodeURIComponent(req.params.siloBaseUrl)
      : '';

  if (!siloBaseUrl) {
    return res
      .status(400)
      .json({ ok: false, error: 'siloBaseUrl is required' });
  }

  const silo = await db.query.cpSiloRegistry.findFirst({
    where: eq(cpSiloRegistry.siloBaseUrl, siloBaseUrl),
  });

  if (!silo) {
    return res.status(404).json({ ok: false, error: 'Silo not found' });
  }

  const orgs = await db.query.cpOrganization.findMany({
    where: eq(cpOrganization.siloBaseUrl, siloBaseUrl),
    columns: {
      id: true,
      name: true,
      sector: true,
      status: true,
      siloOrgId: true,
      createdAt: true,
    },
  });

  return res.status(200).json({ ok: true, silo, orgs });
};
