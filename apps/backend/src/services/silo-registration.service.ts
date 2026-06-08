import { getSectorConfig } from '@repo/config';
import { emergencyRequest, organization } from '@repo/db/schemas';

import { sql } from 'drizzle-orm';

import { envConfig, logger } from '@/config';
import db from '@/db';

/* ──────────────────────────────────────────
   Called once on silo boot.
   Registers this silo with the control plane and pushes:
     - Silo identity (base URL, sector)
     - Org list with names + ids
     - Incident summary counts
   The CP reconciles orphans and stores metrics.
   ────────────────────────────────────────── */
export async function registerSiloWithControlPlane(): Promise<void> {
  const cpUrl = String(envConfig.control_pane_url ?? '').replace(/\/$/, '');
  const siloBaseUrl = String(
    envConfig.silo_base_url ?? `http://localhost:${envConfig.port}`
  );
  const cfg = getSectorConfig();
  const sector = cfg.sector;

  if (!cpUrl) {
    logger.warn(
      '[SILO_REG] No CONTROL_PANE_URL configured — skipping registration'
    );
    return;
  }

  try {
    const orgs = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization);

    // Collect incident summary.
    const counts = await db
      .select({
        status: emergencyRequest.requestStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(emergencyRequest)
      .groupBy(emergencyRequest.requestStatus);

    const incidentSummary = {
      total: counts.reduce((sum, r) => sum + r.count, 0),
      pending: counts.find(r => r.status === 'pending')?.count ?? 0,
      active:
        counts.find(r =>
          ['accepted', 'assigned', 'in_progress'].includes(r.status ?? '')
        )?.count ?? 0,
      completed: counts.find(r => r.status === 'completed')?.count ?? 0,
      cancelled: counts.find(r => r.status === 'cancelled')?.count ?? 0,
    };

    logger.info(
      `[SILO_REG] Registering with CP at ${cpUrl} — ${orgs.length} orgs, ${incidentSummary.total} incidents`
    );

    const res = await fetch(`${cpUrl}/internal/silos/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': String(envConfig.internal_api_key ?? ''),
      },
      body: JSON.stringify({
        tenantId: String(envConfig.tenant_id ?? ''),
        siloBaseUrl,
        sector,
        orgs,
        incidentSummary,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error(
        `[SILO_REG] CP registration failed (${res.status}): ${text}`
      );
      return;
    }

    const json = (await res.json().catch(() => ({}))) as any;

    if (json.reconciledOrgs?.length > 0) {
      logger.info(
        `[SILO_REG] Reconciled ${json.reconciledOrgs.length} orgs with CP`
      );
    }

    logger.info('[SILO_REG] Registration successful');
  } catch (err: any) {
    // Non-fatal — silo can operate without CP registration.
    logger.warn(`[SILO_REG] Failed to register with CP: ${err.message ?? err}`);
  }
}
