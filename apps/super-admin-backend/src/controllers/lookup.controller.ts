import { cpOrganization } from '@repo/db/control-plane';

import { and, asc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';

// mobile responder lookup: resolve org name -> sector + silo url + orgid.
export const lookupOrgByName = async (req: Request, res: Response) => {
  const name = typeof req.query?.name === 'string' ? req.query.name.trim() : '';
  if (!name) {
    return res.status(400).json({ ok: false, error: 'Missing name' });
  }

  const org = await db.query.cpOrganization.findFirst({
    where: eq(cpOrganization.name, name),
    columns: {
      id: true,
      sector: true,
      siloBaseUrl: true,
      status: true,
    },
  });

  if (!org) {
    return res.status(404).json({ ok: false, error: 'Org not found' });
  }

  return res.status(200).json({
    ok: true,
    org: {
      orgId: org.id,
      sector: org.sector,
      siloBaseUrl: org.siloBaseUrl,
      status: org.status,
    },
  });
};

// Mobile responder lookup: list orgs for sector picker.
// NOTE: this is intentionally unauthenticated for "easy UX".
export const listOrgsForLookup = async (req: Request, res: Response) => {
  const sector = typeof req.query?.sector === 'string' ? req.query.sector : '';
  const status = typeof req.query?.status === 'string' ? req.query.status : '';

  // Allow mobile apps to replace localhost URLs in dev, since physical devices
  // cannot reach services bound to the laptop's loopback interface.
  const clientHost =
    typeof req.query?.clientHost === 'string' ? req.query.clientHost : '';

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
    columns: {
      id: true,
      name: true,
      sector: true,
      status: true,
      siloBaseUrl: true,
    },
    orderBy: [asc(cpOrganization.name)],
  });

  const normalizedOrgs = clientHost
    ? orgs.map(o => ({
        ...o,
        siloBaseUrl:
          typeof o.siloBaseUrl === 'string'
            ? o.siloBaseUrl.replace(/\blocalhost\b/g, clientHost)
            : o.siloBaseUrl,
      }))
    : orgs;

  return res.status(200).json({ ok: true, orgs: normalizedOrgs });
};
