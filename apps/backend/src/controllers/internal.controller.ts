import {
  auditLog,
  organization,
  organizationEntitlementsSnapshot,
  serviceProvider,
  user,
} from '@repo/db/schemas';

import bcrypt from 'bcryptjs';
import { desc, eq, gte, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { ServiceTypeEnum } from '@/constants';
import db from '@/db';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

export async function getInternalMetrics() {
  const [orgsRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organization);
  const [usersRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);
  const [providersRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(serviceProvider);

  return {
    orgs: orgsRow?.count ?? 0,
    users: usersRow?.count ?? 0,
    providers: providersRow?.count ?? 0,
  };
}

export async function getOrgSnapshots() {
  const orgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      email: organization.email,
      serviceCategory: organization.serviceCategory,
      orgStatus: organization.status,
      lifecycleStatus: organization.lifecycleStatus,
      isVerified: organization.isVerified,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    })
    .from(organization);

  return orgs;
}

const health = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'ok', { ok: true }));
});

const metrics = asyncHandler(async (_req: Request, res: Response) => {
  const metrics = await getInternalMetrics();
  res.status(200).json(
    new ApiResponse(200, 'Metrics', {
      mode: envConfig.mode,
      sector: envConfig.mode === 'silo' ? process.env.SECTOR : null,
      metrics,
    })
  );
});

const orgSnapshots = asyncHandler(async (_req: Request, res: Response) => {
  const orgs = await getOrgSnapshots();
  res.status(200).json(
    new ApiResponse(200, 'Org snapshots', {
      mode: envConfig.mode,
      sector: envConfig.mode === 'silo' ? process.env.SECTOR : null,
      orgs,
    })
  );
});

const provisionOrg = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, serviceCategory, generalNumber, password } = (req.body ??
    {}) as Record<string, unknown>;

  // TODO: Move this validation to route level from here
  // Minimal input validation; control plane is expected to call this.
  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof serviceCategory !== 'string' ||
    (typeof generalNumber !== 'number' && typeof generalNumber !== 'string') ||
    typeof password !== 'string'
  ) {
    return res.status(400).json(new ApiResponse(400, 'Invalid payload', null));
  }

  if (!Object.values(ServiceTypeEnum).includes(serviceCategory as any)) {
    return res
      .status(400)
      .json(new ApiResponse(400, 'Invalid serviceCategory', null));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(organization)
    .values({
      name,
      email,
      serviceCategory: serviceCategory as any,
      generalNumber: Number(generalNumber),
      password: hashedPassword,
      lifecycleStatus: 'pending_approval',
    })
    .returning({ id: organization.id });

  return res
    .status(201)
    .json(new ApiResponse(201, 'Organization provisioned', created));
});

// Control plane pushes lifecycle status changes (approve/suspend/reactivate)
const updateOrgStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params;
  const { lifecycleStatus } = (req.body ?? {}) as Record<string, unknown>;

  if (typeof orgId !== 'string' || orgId.length === 0) {
    return res.status(400).json(new ApiResponse(400, 'Invalid orgId', null));
  }

  const allowed = [
    'pending_approval',
    'active',
    'suspended',
    'trial_expired',
  ] as const;
  if (
    typeof lifecycleStatus !== 'string' ||
    !(allowed as readonly string[]).includes(lifecycleStatus)
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, 'Invalid lifecycleStatus', null));
  }

  const [updated] = await db
    .update(organization)
    .set({ lifecycleStatus: lifecycleStatus as any })
    .where(eq(organization.id, orgId as any))
    .returning({
      id: organization.id,
      lifecycleStatus: organization.lifecycleStatus,
    });

  if (!updated) {
    return res
      .status(404)
      .json(new ApiResponse(404, 'Organization not found', null));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Organization status updated', updated));
});

// Control plane pushes entitlements snapshots (versioned).
const storeOrgEntitlementsSnapshot = asyncHandler(
  async (req: Request, res: Response) => {
    const { orgId } = req.params;
    const { version, entitlements } = (req.body ?? {}) as Record<
      string,
      unknown
    >;

    if (typeof orgId !== 'string' || orgId.length === 0) {
      return res.status(400).json(new ApiResponse(400, 'Invalid orgId', null));
    }

    if (
      typeof version !== 'number' ||
      !Number.isInteger(version) ||
      version <= 0
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, 'Invalid version', null));
    }

    if (!entitlements || typeof entitlements !== 'object') {
      return res
        .status(400)
        .json(new ApiResponse(400, 'Invalid entitlements', null));
    }

    // Ensure org exists.
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId as any),
      columns: { id: true },
    });
    if (!org) {
      return res
        .status(404)
        .json(new ApiResponse(404, 'Organization not found', null));
    }

    const latest = await db.query.organizationEntitlementsSnapshot.findFirst({
      where: eq(organizationEntitlementsSnapshot.organizationId, orgId as any),
      columns: { version: true },
      orderBy: [desc(organizationEntitlementsSnapshot.version)],
    });
    const current = latest?.version ?? 0;

    if (version <= current) {
      return res.status(200).json(
        new ApiResponse(200, 'Entitlements already up to date', {
          currentVersion: current,
          receivedVersion: version,
        })
      );
    }

    const [created] = await db
      .insert(organizationEntitlementsSnapshot)
      .values({
        organizationId: orgId as any,
        version,
        entitlements: entitlements as any,
      })
      .returning({
        id: organizationEntitlementsSnapshot.id,
        version: organizationEntitlementsSnapshot.version,
      });

    return res
      .status(201)
      .json(new ApiResponse(201, 'Entitlements snapshot stored', created));
  }
);

// Sanitized compliance index for control plane ingestion.
// Returns aggregated counts only (no IDs/emails/PHI).
const sanitizedIndex = asyncHandler(async (req: Request, res: Response) => {
  const sinceRaw = req.query?.since;
  const since =
    typeof sinceRaw === 'string' && sinceRaw.length > 0
      ? new Date(sinceRaw)
      : new Date(Date.now() - 60 * 60 * 1000);

  if (Number.isNaN(since.getTime())) {
    return res
      .status(400)
      .json(new ApiResponse(400, 'Invalid since cursor', null));
  }

  const bucketExpr = sql<string>`date_trunc('hour', ${auditLog.createdAt}::timestamptz)::text`;
  const statusClassExpr = sql<string>`substr(${auditLog.statusCode}, 1, 1)`;

  const rows = await db
    .select({
      bucket: bucketExpr,
      actorType: auditLog.actorType,
      statusClass: statusClassExpr,
      count: sql<number>`count(*)::int`,
    })
    .from(auditLog)
    .where(gte(auditLog.createdAt, since.toISOString()))
    .groupBy(bucketExpr, auditLog.actorType, statusClassExpr)
    .orderBy(bucketExpr);

  return res.status(200).json(
    new ApiResponse(200, 'Sanitized index', {
      mode: envConfig.mode,
      sector: envConfig.mode === 'silo' ? process.env.SECTOR : null,
      since: since.toISOString(),
      nextCursor: new Date().toISOString(),
      aggregates: rows,
    })
  );
});

const internalController = {
  // data helpers
  getInternalMetrics,
  getOrgSnapshots,

  // request handlers (used by routes)
  health,
  metrics,
  orgSnapshots,
  provisionOrg,
  updateOrgStatus,
  storeOrgEntitlementsSnapshot,
  sanitizedIndex,
} as const;

export default internalController;
