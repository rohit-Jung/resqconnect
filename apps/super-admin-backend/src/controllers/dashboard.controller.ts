import {
  cpOrgReplica,
  cpOrganization,
  cpSiloMetrics,
} from '@repo/db/control-plane';

import { and, asc, desc, gte, inArray, lt, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { db } from '@/db';

type DashboardEntity = { name: string; email: string; createdAt: string };
type DashboardStats = {
  total: number;
  thisMonth: number;
  lastMonth: number;
  info: DashboardEntity[];
};

type SiloDashboardAnalytics = {
  orgs?: { total: number; thisMonth: number; lastMonth: number; info: any[] };
  users?: { total: number; thisMonth: number; lastMonth: number; info: any[] };
  providers?: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    info: any[];
  };
};

function startOfMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

function addMonths(d: Date, months: number) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, 0, 0, 0, 0)
  );
}

function metricNum(
  metrics: Record<string, unknown> | null | undefined,
  key: string
) {
  const v = (metrics as any)?.[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function baseUrl(url: string) {
  return url.replace(/\/$/, '');
}

function extractSiloAnalytics(json: unknown): SiloDashboardAnalytics | null {
  const root = (json as any) ?? null;
  if (!root || typeof root !== 'object') return null;

  // Support common wrappers:
  // - silo ApiResponse: { statusCode, message, data: { orgs, users, providers } }
  // - control-plane style: { ok: true, data: { orgs, users, providers } }
  const lvl1 = (root as any).data ?? root;
  const candidate =
    (lvl1 as any)?.orgs && (lvl1 as any)?.users && (lvl1 as any)?.providers
      ? lvl1
      : (lvl1 as any)?.data;

  if (!candidate || typeof candidate !== 'object') return null;
  if (
    !(candidate as any).orgs &&
    !(candidate as any).users &&
    !(candidate as any).providers
  ) {
    return null;
  }
  return candidate as any;
}

function coerceEntity(v: any): DashboardEntity | null {
  if (!v || typeof v !== 'object') return null;
  const name = typeof v.name === 'string' ? v.name : '';
  const email = typeof v.email === 'string' ? v.email : '';
  const createdAtRaw = v.createdAt;

  let createdAt = '';
  if (createdAtRaw instanceof Date) createdAt = createdAtRaw.toISOString();
  else if (typeof createdAtRaw === 'string') createdAt = createdAtRaw;
  else if (typeof createdAtRaw === 'number')
    createdAt = new Date(createdAtRaw).toISOString();
  else if (createdAtRaw) createdAt = new Date(createdAtRaw).toISOString();

  if (!name && !email && !createdAt) return null;
  return { name, email, createdAt };
}

function sortEntities(
  entities: DashboardEntity[],
  sortField: 'createdAt' | 'name' | 'email',
  sortBy: 'asc' | 'desc'
) {
  const dir = sortBy === 'asc' ? 1 : -1;
  const cmp = (a: DashboardEntity, b: DashboardEntity) => {
    if (sortField === 'createdAt') {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      const aNum = Number.isFinite(at) ? at : 0;
      const bNum = Number.isFinite(bt) ? bt : 0;
      return (aNum - bNum) * dir;
    }
    const av = String((a as any)[sortField] ?? '');
    const bv = String((b as any)[sortField] ?? '');
    return av.localeCompare(bv, undefined, { sensitivity: 'base' }) * dir;
  };

  // V8's sort is stable in modern Node; rely on that for predictable ordering.
  entities.sort(cmp);
}

async function fetchInternalJson(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-internal-api-key': envConfig.internal_api_key,
    },
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      error: text || `Request failed with status ${res.status}`,
    };
  }

  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }
  return { ok: true as const, json };
}

function latestAtOrBefore<T extends { collectedAt: Date }>(
  rows: T[],
  at: Date
) {
  // rows are expected to be sorted asc by collectedAt
  let last: T | null = null;
  for (const r of rows) {
    if (r.collectedAt.getTime() <= at.getTime()) last = r;
    else break;
  }
  return last;
}

export const getDashboard = async (req: Request, res: Response) => {
  const pageRaw = typeof req.query?.page === 'string' ? req.query.page : '';
  const limitRaw = typeof req.query?.limit === 'string' ? req.query.limit : '';
  const sortByRaw =
    typeof req.query?.sortBy === 'string' ? req.query.sortBy : '';
  const sortFieldRaw =
    typeof req.query?.sortField === 'string' ? req.query.sortField : '';

  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = Math.min(50, Math.max(1, Number(limitRaw) || 5));
  const sortBy: 'asc' | 'desc' = sortByRaw === 'asc' ? 'asc' : 'desc';
  const sortField: 'createdAt' | 'name' | 'email' =
    sortFieldRaw === 'name' ||
    sortFieldRaw === 'email' ||
    sortFieldRaw === 'createdAt'
      ? (sortFieldRaw as any)
      : 'createdAt';

  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = addMonths(monthStart, -1);
  const nextMonthStart = addMonths(monthStart, 1);

  // Orgs counts from control-plane registry.
  const [orgTotalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cpOrganization);
  const [orgThisMonthRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cpOrganization)
    .where(
      and(
        gte(cpOrganization.createdAt, monthStart),
        lt(cpOrganization.createdAt, nextMonthStart)
      )
    );
  const [orgLastMonthRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cpOrganization)
    .where(
      and(
        gte(cpOrganization.createdAt, prevMonthStart),
        lt(cpOrganization.createdAt, monthStart)
      )
    );

  // Org info list for the dashboard. Email is best-effort from the latest org replica snapshot.
  const orderBy =
    sortField === 'name'
      ? [
          sortBy === 'asc'
            ? asc(cpOrganization.name)
            : desc(cpOrganization.name),
        ]
      : [
          sortBy === 'asc'
            ? asc(cpOrganization.createdAt)
            : desc(cpOrganization.createdAt),
        ];

  const orgPage = await db.query.cpOrganization.findMany({
    orderBy,
    limit,
    offset: (page - 1) * limit,
    columns: { id: true, name: true, createdAt: true },
  });

  const orgIds = orgPage.map(o => o.id);
  const replicas = orgIds.length
    ? await db.query.cpOrgReplica.findMany({
        where: inArray(cpOrgReplica.cpOrgId, orgIds),
        columns: { cpOrgId: true, snapshot: true },
      })
    : [];

  const replicaByOrgId = new Map<string, (typeof replicas)[number]>();
  for (const r of replicas) replicaByOrgId.set(r.cpOrgId, r);

  const orgInfo: DashboardEntity[] = orgPage.map(o => {
    const snap = (replicaByOrgId.get(o.id)?.snapshot ?? {}) as any;
    const email = typeof snap?.email === 'string' ? snap.email : '';
    return {
      name: o.name,
      email,
      createdAt: (o.createdAt instanceof Date
        ? o.createdAt
        : new Date(o.createdAt as any)
      ).toISOString(),
    };
  });

  // Users/providers counts from silo metrics (aggregated only).
  const metricsRows = await db.query.cpSiloMetrics.findMany({
    where: gte(cpSiloMetrics.collectedAt, prevMonthStart),
    orderBy: [asc(cpSiloMetrics.collectedAt)],
    columns: { siloBaseUrl: true, collectedAt: true, metrics: true },
  });

  const bySilo = new Map<string, typeof metricsRows>();
  for (const r of metricsRows) {
    const list = bySilo.get(r.siloBaseUrl) ?? [];
    list.push(r);
    bySilo.set(r.siloBaseUrl, list);
  }

  let usersTotal = 0;
  let usersThisMonth = 0;
  let usersLastMonth = 0;
  let providersTotal = 0;
  let providersThisMonth = 0;
  let providersLastMonth = 0;

  for (const rows of bySilo.values()) {
    const latest = rows[rows.length - 1];
    if (!latest) continue;

    const atPrev = latestAtOrBefore(rows, prevMonthStart) ?? rows[0];
    const atMonth = latestAtOrBefore(rows, monthStart) ?? rows[0];

    const latestUsers = metricNum(latest.metrics as any, 'users');
    const monthUsers = metricNum(atMonth?.metrics as any, 'users');
    const prevUsers = metricNum(atPrev?.metrics as any, 'users');

    const latestProviders = metricNum(latest.metrics as any, 'providers');
    const monthProviders = metricNum(atMonth?.metrics as any, 'providers');
    const prevProviders = metricNum(atPrev?.metrics as any, 'providers');

    usersTotal += latestUsers;
    usersThisMonth += Math.max(0, latestUsers - monthUsers);
    usersLastMonth += Math.max(0, monthUsers - prevUsers);

    providersTotal += latestProviders;
    providersThisMonth += Math.max(0, latestProviders - monthProviders);
    providersLastMonth += Math.max(0, monthProviders - prevProviders);
  }

  // Recent user/provider lists: fan-out to silos (internal auth) and merge.
  // This is intentionally best-effort; failures in one silo should not break the dashboard.
  const siloUrls = await db
    .select({ siloBaseUrl: cpOrganization.siloBaseUrl })
    .from(cpOrganization);
  const uniqueSiloUrls = Array.from(
    new Set(
      siloUrls
        .map(r => (typeof r.siloBaseUrl === 'string' ? r.siloBaseUrl : ''))
        .filter(Boolean)
    )
  );

  const perSiloLimit = Math.min(50, page * limit);
  const q = new URLSearchParams({
    page: '1',
    limit: String(perSiloLimit),
    sortBy,
    sortField,
  });

  const siloResults = await Promise.all(
    uniqueSiloUrls.map(async siloBaseUrl => {
      const url = `${baseUrl(siloBaseUrl)}/api/v1/internal/admin-dashboard-analytics?${q.toString()}`;
      const r = await fetchInternalJson(url);
      if (!r.ok) return null;
      return extractSiloAnalytics(r.json);
    })
  );

  const rawUsers = siloResults.flatMap(r =>
    Array.isArray(r?.users?.info) ? r!.users!.info : []
  );
  const rawProviders = siloResults.flatMap(r =>
    Array.isArray(r?.providers?.info) ? r!.providers!.info : []
  );

  const usersInfoAll: DashboardEntity[] = [];
  const providersInfoAll: DashboardEntity[] = [];
  for (const u of rawUsers) {
    const e = coerceEntity(u);
    if (e) usersInfoAll.push(e);
  }
  for (const p of rawProviders) {
    const e = coerceEntity(p);
    if (e) providersInfoAll.push(e);
  }

  const dedupe = (list: DashboardEntity[]) => {
    const seen = new Set<string>();
    const out: DashboardEntity[] = [];
    for (const e of list) {
      const key = e.email
        ? `email:${e.email.toLowerCase()}`
        : `row:${e.name}|${e.createdAt}|${e.email}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
    return out;
  };

  const usersMerged = dedupe(usersInfoAll);
  const providersMerged = dedupe(providersInfoAll);

  sortEntities(usersMerged, sortField, sortBy);
  sortEntities(providersMerged, sortField, sortBy);

  const pageOffset = (page - 1) * limit;
  const usersInfo = usersMerged.slice(pageOffset, pageOffset + limit);
  const providersInfo = providersMerged.slice(pageOffset, pageOffset + limit);

  // If metrics haven't been ingested yet, fall back to summing silo totals for counts.
  if (metricsRows.length === 0) {
    for (const r of siloResults) {
      if (!r) continue;
      usersTotal += Number((r as any)?.users?.total) || 0;
      usersThisMonth += Number((r as any)?.users?.thisMonth) || 0;
      usersLastMonth += Number((r as any)?.users?.lastMonth) || 0;

      providersTotal += Number((r as any)?.providers?.total) || 0;
      providersThisMonth += Number((r as any)?.providers?.thisMonth) || 0;
      providersLastMonth += Number((r as any)?.providers?.lastMonth) || 0;
    }
  }

  const payload = {
    orgs: {
      total: orgTotalRow?.count ?? 0,
      thisMonth: orgThisMonthRow?.count ?? 0,
      lastMonth: orgLastMonthRow?.count ?? 0,
      info: orgInfo,
    } satisfies DashboardStats,
    users: {
      total: usersTotal,
      thisMonth: usersThisMonth,
      lastMonth: usersLastMonth,
      info: usersInfo,
    } satisfies DashboardStats,
    providers: {
      total: providersTotal,
      thisMonth: providersThisMonth,
      lastMonth: providersLastMonth,
      info: providersInfo,
    } satisfies DashboardStats,
  };

  return res.status(200).json({ ok: true, data: payload });
};
