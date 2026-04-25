import {
  cpOrgReplica,
  cpOrganization,
  cpSanitizedAuditAggregate,
  cpSiloMetrics,
  cpSiloPollCursor,
} from '@repo/db/control-plane';

import { eq } from 'drizzle-orm';

import { envConfig } from '@/config';
import { db } from '@/db';

type SiloSanitizedIndexRow = {
  bucket: string;
  actorType: string;
  statusClass: string;
  count: number;
};

type SiloSanitizedIndexResponse = {
  data?: {
    sector?: string;
    since?: string;
    nextCursor?: string;
    aggregates?: SiloSanitizedIndexRow[];
  };
  sector?: string;
  since?: string;
  nextCursor?: string;
  aggregates?: SiloSanitizedIndexRow[];
};

function baseUrl(url: string) {
  return url.replace(/\/$/, '');
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
      error: text || 'Request failed',
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

function parseDateOrNull(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function upsertCursor(siloBaseUrl: string) {
  const existing = await db.query.cpSiloPollCursor.findFirst({
    where: eq(cpSiloPollCursor.siloBaseUrl, siloBaseUrl),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(cpSiloPollCursor)
    .values({ siloBaseUrl })
    .returning();
  return created!;
}

export async function pollSilosOnce() {
  const orgs = await db.query.cpOrganization.findMany({
    columns: {
      id: true,
      siloBaseUrl: true,
      siloOrgId: true,
      sector: true,
    },
  });

  const siloUrls = Array.from(
    new Set(orgs.map(o => o.siloBaseUrl).filter(Boolean))
  );

  for (const siloBaseUrl of siloUrls) {
    const cursorRow = await upsertCursor(siloBaseUrl);

    // 1) Sanitized index (incremental)
    const since = cursorRow.sanitizedIndexCursor?.toISOString();
    const indexUrl = `${baseUrl(siloBaseUrl)}/api/v1/internal/sanitized-index${
      since ? `?since=${encodeURIComponent(since)}` : ''
    }`;

    const idxRes = await fetchInternalJson(indexUrl);
    if (idxRes.ok) {
      const payload: SiloSanitizedIndexResponse = idxRes.json;
      const data = (payload as any)?.data ?? payload;
      const sector = String(data?.sector ?? 'unknown');
      const nextCursorRaw = data?.nextCursor;
      const aggregates: SiloSanitizedIndexRow[] = Array.isArray(
        data?.aggregates
      )
        ? data.aggregates
        : [];

      for (const row of aggregates) {
        const bucketRaw = String(row.bucket);
        const bucketStart = parseDateOrNull(bucketRaw);
        await db
          .insert(cpSanitizedAuditAggregate)
          .values({
            siloBaseUrl,
            sector,
            bucket: bucketRaw,
            actorType: String(row.actorType),
            statusClass: String(row.statusClass),
            count: Number(row.count) || 0,
            bucketStart,
          })
          .onConflictDoUpdate({
            target: [
              cpSanitizedAuditAggregate.siloBaseUrl,
              cpSanitizedAuditAggregate.bucket,
              cpSanitizedAuditAggregate.actorType,
              cpSanitizedAuditAggregate.statusClass,
            ],
            set: {
              count: Number(row.count) || 0,
              updatedAt: new Date(),
            },
          });
      }

      if (typeof nextCursorRaw === 'string' && nextCursorRaw.length > 0) {
        await db
          .update(cpSiloPollCursor)
          .set({
            sanitizedIndexCursor: new Date(nextCursorRaw),
            lastPolledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(cpSiloPollCursor.siloBaseUrl, siloBaseUrl));
      }
    }

    // 2) Metrics (non-incremental; append-only)
    const metricsUrl = `${baseUrl(siloBaseUrl)}/api/v1/internal/metrics`;
    const metricsRes = await fetchInternalJson(metricsUrl);
    if (metricsRes.ok) {
      const metricsData = (metricsRes.json as any)?.data ?? metricsRes.json;
      await db.insert(cpSiloMetrics).values({
        siloBaseUrl,
        sector: String(metricsData?.sector ?? 'unknown'),
        metrics: (metricsData?.metrics ?? metricsData) as any,
        collectedAt: new Date(),
      });
    }

    // 3) Org snapshots (full refresh; we keep latest per org)
    const snapshotsUrl = `${baseUrl(siloBaseUrl)}/api/v1/internal/org-snapshots`;
    const snapshotsRes = await fetchInternalJson(snapshotsUrl);
    if (snapshotsRes.ok) {
      const snapshotsData =
        (snapshotsRes.json as any)?.data ?? snapshotsRes.json;
      const snapshots = Array.isArray(snapshotsData?.orgs)
        ? snapshotsData.orgs
        : Array.isArray(snapshotsData)
          ? snapshotsData
          : [];

      const bySiloOrgId = new Map<string, any>();
      for (const s of snapshots) {
        const id = String(s?.id ?? s?.orgId ?? '');
        if (!id) continue;
        bySiloOrgId.set(id, s);
      }

      for (const org of orgs.filter(
        o => o.siloBaseUrl === siloBaseUrl && o.siloOrgId
      )) {
        const s = bySiloOrgId.get(String(org.siloOrgId));
        if (!s) continue;

        await db
          .insert(cpOrgReplica)
          .values({
            cpOrgId: org.id,
            siloBaseUrl,
            siloOrgId: org.siloOrgId!,
            snapshot: s,
            capturedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [cpOrgReplica.siloBaseUrl, cpOrgReplica.siloOrgId],
            set: {
              snapshot: s,
              capturedAt: new Date(),
              updatedAt: new Date(),
            },
          });
      }

      await db
        .update(cpSiloPollCursor)
        .set({ lastPolledAt: new Date(), updatedAt: new Date() })
        .where(eq(cpSiloPollCursor.siloBaseUrl, siloBaseUrl));
    }
  }
}
