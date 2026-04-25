import {
  cpOrgReplica,
  cpOrganization,
  cpSiloMetrics,
} from '@repo/db/control-plane';

import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { db } from '@/db';
import { isPgError } from '@/utils/pg-error';
import {
  provisionOrgSchema,
  updateOrgStatusSchema,
} from '@/validations/orgs.validation';

export const listOrgs = async (req: Request, res: Response) => {
  const sector = typeof req.query?.sector === 'string' ? req.query.sector : '';
  const status = typeof req.query?.status === 'string' ? req.query.status : '';

  const allowedSectors = ['hospital', 'police', 'fire'];
  const allowedStatuses = [
    'pending_approval',
    'active',
    'suspended',
    'trial_expired',
  ];
  if (sector && !allowedSectors.includes(sector)) {
    return res.status(400).json({ ok: false, error: 'Invalid sector filter' });
  }
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status filter' });
  }

  const where = [] as ReturnType<typeof eq>[];
  if (sector) where.push(eq(cpOrganization.sector, sector as any));
  if (status) where.push(eq(cpOrganization.status, status as any));

  const orgs = await db.query.cpOrganization.findMany({
    where: where.length > 0 ? and(...where) : undefined,
    orderBy: [asc(cpOrganization.createdAt)],
  });

  return res.status(200).json({ ok: true, orgs });
};

export const getOrgById = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing org id' });
  }

  const includeSilo =
    req.query?.includeSilo === '1' ||
    req.query?.includeSilo === 'true' ||
    req.query?.includeSilo === 'yes';

  function baseUrl(url: string) {
    return url.replace(/\/$/, '');
  }

  async function fetchInternalJson(url: string) {
    const siloRes = await fetch(url, {
      method: 'GET',
      headers: {
        'x-internal-api-key': envConfig.internal_api_key,
      },
    });

    const text = await siloRes.text().catch(() => '');
    if (!siloRes.ok) {
      return {
        ok: false as const,
        status: siloRes.status,
        error: text || `Request failed with status ${siloRes.status}`,
      };
    }

    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      // ignore
    }
    return { ok: true as const, json };
  }

  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, id),
  });

  if (!org) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  const replica = await db.query.cpOrgReplica.findFirst({
    where: eq(cpOrgReplica.cpOrgId, id as any),
    columns: { snapshot: true, capturedAt: true },
    orderBy: [desc(cpOrgReplica.capturedAt)],
  });

  const metricsLatest = await db.query.cpSiloMetrics.findFirst({
    where: eq(cpSiloMetrics.siloBaseUrl, org.siloBaseUrl),
    columns: { metrics: true, collectedAt: true, sector: true },
    orderBy: [desc(cpSiloMetrics.collectedAt)],
  });

  let silo:
    | {
        org: unknown | null;
        metrics: unknown | null;
        sector: string | null;
      }
    | undefined = undefined;

  if (includeSilo) {
    const metricsUrl = `${baseUrl(org.siloBaseUrl)}/api/v1/internal/metrics`;
    const snapshotsUrl = `${baseUrl(org.siloBaseUrl)}/api/v1/internal/org-snapshots`;

    const [metricsRes, snapshotsRes] = await Promise.all([
      fetchInternalJson(metricsUrl),
      fetchInternalJson(snapshotsUrl),
    ]);

    let siloSector: string | null = null;
    let siloMetrics: unknown | null = null;
    let siloOrg: unknown | null = null;

    if (metricsRes.ok) {
      const payload: any = metricsRes.json;
      const data = payload?.data ?? payload;
      siloSector = typeof data?.sector === 'string' ? data.sector : null;
      siloMetrics = data?.metrics ?? null;

      if (siloMetrics && typeof siloMetrics === 'object') {
        await db.insert(cpSiloMetrics).values({
          siloBaseUrl: org.siloBaseUrl,
          sector: siloSector ?? 'unknown',
          metrics: siloMetrics as any,
          collectedAt: new Date(),
        });
      }
    }

    // If live fetch failed, fall back to cached latest metrics.
    if (!metricsRes.ok && metricsLatest) {
      siloSector = metricsLatest.sector ?? null;
      siloMetrics = metricsLatest.metrics ?? null;
    }

    if (snapshotsRes.ok && org.siloOrgId) {
      const payload: any = snapshotsRes.json;
      const data = payload?.data ?? payload;
      const orgs = Array.isArray(data?.orgs)
        ? data.orgs
        : Array.isArray(data)
          ? data
          : [];

      const match = orgs.find(
        (o: any) => String(o?.id ?? '') === String(org.siloOrgId)
      );
      if (match) {
        siloOrg = match;
        await db
          .insert(cpOrgReplica)
          .values({
            cpOrgId: org.id,
            siloBaseUrl: org.siloBaseUrl,
            siloOrgId: org.siloOrgId,
            snapshot: match,
            capturedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [cpOrgReplica.siloBaseUrl, cpOrgReplica.siloOrgId],
            set: {
              snapshot: match,
              capturedAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }
    }

    // If live fetch failed (or org wasn't present), fall back to cached snapshot.
    if (!siloOrg && replica?.snapshot) {
      siloOrg = replica.snapshot;
    }

    silo = {
      org: siloOrg,
      metrics: siloMetrics,
      sector: siloSector,
    };
  }

  return res.status(200).json({
    ok: true,
    org,
    replica: replica
      ? { snapshot: replica.snapshot, capturedAt: replica.capturedAt }
      : null,
    siloMetricsLatest: metricsLatest
      ? {
          sector: metricsLatest.sector,
          metrics: metricsLatest.metrics,
          collectedAt: metricsLatest.collectedAt,
        }
      : null,
    ...(includeSilo ? { silo } : {}),
  });
};

export const deleteOrg = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing org id' });
  }

  const existing = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, id),
    columns: { id: true },
  });
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  // Deregister from control plane; this does not delete silo data.
  await db.delete(cpOrgReplica).where(eq(cpOrgReplica.cpOrgId, id as any));
  await db.delete(cpOrganization).where(eq(cpOrganization.id, id));

  return res.status(200).json({ ok: true });
};

export const provisionOrg = async (req: Request, res: Response) => {
  const parsed = provisionOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  const {
    name,
    email,
    serviceCategory,
    generalNumber,
    password,
    sector,
    siloBaseUrl,
  } = parsed.data;

  // Zod trims, but keep this local normalization explicit.
  const normalizedName = name;

  // Treat org names as whitespace-insensitive to avoid accidental duplicates.
  const existingMatches = await db
    .select({
      id: cpOrganization.id,
      name: cpOrganization.name,
      siloOrgId: cpOrganization.siloOrgId,
      siloBaseUrl: cpOrganization.siloBaseUrl,
      sector: cpOrganization.sector,
      createdAt: cpOrganization.createdAt,
    })
    .from(cpOrganization)
    .where(sql`btrim(${cpOrganization.name}) = ${normalizedName}`)
    .orderBy(asc(cpOrganization.createdAt))
    .limit(2);

  if (existingMatches.length > 1) {
    return res.status(409).json({
      ok: false,
      error:
        'Multiple organizations match this name (whitespace variants). Clean up duplicates first.',
      matches: existingMatches.map(o => ({ id: o.id, name: o.name })),
    });
  }

  const existing = existingMatches[0];
  if (existing?.id) {
    // Normalize stored name (remove leading/trailing whitespace).
    // Safe because we already matched by btrim(name) and ensured only one match.
    if (existing.name !== normalizedName) {
      await db
        .update(cpOrganization)
        .set({ name: normalizedName })
        .where(eq(cpOrganization.id, existing.id));
    }

    // Prevent silently reusing an existing org with different parameters.
    if (existing.sector !== sector || existing.siloBaseUrl !== siloBaseUrl) {
      return res.status(409).json({
        ok: false,
        error: 'Organization already exists with different configuration',
        orgId: existing.id,
      });
    }

    // If an org already exists, we treat provision as idempotent only when the silo mapping
    // hasn't been written yet. Otherwise we return a clear 409.
    if (existing.siloOrgId) {
      return res.status(409).json({
        ok: false,
        error: 'Organization already exists',
        orgId: existing.id,
      });
    }
  }

  let createdCp: { id: string; siloBaseUrl: string } | undefined = undefined;

  if (existing?.id) {
    createdCp = {
      id: String(existing.id),
      siloBaseUrl: String(existing.siloBaseUrl),
    };
  } else {
    try {
      [createdCp] = await db
        .insert(cpOrganization)
        .values({
          name: normalizedName,
          sector,
          status: 'pending_approval',
          siloBaseUrl,
        })
        .returning({
          id: cpOrganization.id,
          siloBaseUrl: cpOrganization.siloBaseUrl,
        });
    } catch (err) {
      // Handle the common case where another request created the org concurrently.
      if (isPgError(err, '23505')) {
        const concurrentMatches = await db
          .select({
            id: cpOrganization.id,
            name: cpOrganization.name,
            siloOrgId: cpOrganization.siloOrgId,
            siloBaseUrl: cpOrganization.siloBaseUrl,
            sector: cpOrganization.sector,
            createdAt: cpOrganization.createdAt,
          })
          .from(cpOrganization)
          .where(sql`btrim(${cpOrganization.name}) = ${normalizedName}`)
          .orderBy(asc(cpOrganization.createdAt))
          .limit(2);

        if (concurrentMatches.length > 1) {
          return res.status(409).json({
            ok: false,
            error:
              'Multiple organizations match this name (whitespace variants). Clean up duplicates first.',
            matches: concurrentMatches.map(o => ({ id: o.id, name: o.name })),
          });
        }

        const concurrent = concurrentMatches[0];
        if (concurrent?.id) {
          if (
            concurrent.sector !== sector ||
            concurrent.siloBaseUrl !== siloBaseUrl
          ) {
            return res.status(409).json({
              ok: false,
              error: 'Organization already exists with different configuration',
              orgId: concurrent.id,
            });
          }
          if (concurrent.siloOrgId) {
            return res.status(409).json({
              ok: false,
              error: 'Organization already exists',
              orgId: concurrent.id,
            });
          }
          createdCp = {
            id: String(concurrent.id),
            siloBaseUrl: String(concurrent.siloBaseUrl),
          };
        }
      }

      if (!createdCp) {
        throw err;
      }
    }
  }

  if (!createdCp) {
    return res
      .status(500)
      .json({ ok: false, error: 'Failed to create org registry' });
  }

  const provisionUrl = `${createdCp.siloBaseUrl.replace(/\/$/, '')}/api/v1/internal/orgs/provision`;
  const siloRes = await fetch(provisionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': envConfig.internal_api_key,
    },
    body: JSON.stringify({
      name,
      email,
      serviceCategory,
      generalNumber,
      password,
    }),
  });

  const siloBodyText = await siloRes.text().catch(() => '');
  if (!siloRes.ok) {
    // If we failed to create the org in the silo, roll back the control-plane registry
    // so the org doesn't show up in the super-admin panel.
    await db
      .delete(cpOrgReplica)
      .where(eq(cpOrgReplica.cpOrgId, createdCp.id as any));
    await db
      .delete(cpOrganization)
      .where(
        and(
          eq(cpOrganization.id, createdCp.id),
          sql`${cpOrganization.siloOrgId} IS NULL`
        )
      );

    return res.status(502).json({
      ok: false,
      error: 'Silo provision failed',
      silo: { status: siloRes.status, body: siloBodyText },
      orgId: createdCp.id,
    });
  }

  let siloJson: any = null;
  try {
    siloJson = JSON.parse(siloBodyText);
  } catch {
    // ignore
  }

  const siloOrgId = siloJson?.data?.id ?? siloJson?.id;
  if (!siloOrgId) {
    // Roll back the control-plane registry if silo didn't return a usable org id.
    await db
      .delete(cpOrgReplica)
      .where(eq(cpOrgReplica.cpOrgId, createdCp.id as any));
    await db
      .delete(cpOrganization)
      .where(
        and(
          eq(cpOrganization.id, createdCp.id),
          sql`${cpOrganization.siloOrgId} IS NULL`
        )
      );

    return res.status(502).json({
      ok: false,
      error: 'Silo provision response missing org id',
      silo: { status: siloRes.status, body: siloBodyText },
      orgId: createdCp.id,
    });
  }

  await db
    .update(cpOrganization)
    .set({ siloOrgId })
    .where(eq(cpOrganization.id, createdCp.id));

  return res.status(201).json({
    ok: true,
    org: { id: createdCp.id, siloBaseUrl: createdCp.siloBaseUrl, siloOrgId },
  });
};

export const updateOrgStatus = async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Missing org id' });
  }
  const parsed = updateOrgStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.id, id),
    columns: {
      id: true,
      siloBaseUrl: true,
      siloOrgId: true,
      sector: true,
    },
  });

  if (!org) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  if (!org.siloBaseUrl || !org.siloOrgId) {
    return res
      .status(400)
      .json({ ok: false, error: 'Org not provisioned to silo yet' });
  }

  const status = parsed.data.status;

  await db
    .update(cpOrganization)
    .set({ status })
    .where(eq(cpOrganization.id, id));

  const url = `${org.siloBaseUrl.replace(/\/$/, '')}/api/v1/internal/orgs/${org.siloOrgId}/status`;
  const siloRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': envConfig.internal_api_key,
    },
    body: JSON.stringify({ lifecycleStatus: status }),
  });

  const siloText = await siloRes.text().catch(() => '');
  if (!siloRes.ok) {
    return res.status(502).json({
      ok: false,
      error: 'Failed to push status to silo',
      silo: { status: siloRes.status, body: siloText },
    });
  }

  return res.status(200).json({ ok: true, status, silo: { ok: true } });
};
