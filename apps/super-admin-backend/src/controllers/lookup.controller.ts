import { cpOrganization } from '@repo/db/control-plane';
import { ApiResponse } from '@repo/utils/api';

import { and, asc, eq, or } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';

// mobile responder lookup: resolve org name -> sector + silo url + orgid.
export const lookupOrgByNameOrId = async (req: Request, res: Response) => {
  const name = typeof req.query?.name === 'string' ? req.query.name.trim() : '';
  const id = typeof req.query?.id === 'string' ? req.query.id.trim() : '';

  if (!name && !id) {
    return res
      .status(400)
      .json(new ApiResponse(400, 'Missing name or id', null));
  }

  const org = await db.query.cpOrganization.findFirst({
    where: or(
      eq(cpOrganization.name, name),
      eq(cpOrganization.id, id),
      eq(cpOrganization.siloOrgId, id)
    ),
    columns: {
      id: true,
      sector: true,
      siloBaseUrl: true,
      status: true,
    },
  });

  if (!org) {
    return res.status(404).json(new ApiResponse(404, 'Org not found', null));
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
    return res
      .status(400)
      .json(new ApiResponse(400, 'Invalid sector filter', null));
  }
  if (status && !allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json(new ApiResponse(400, 'Invalid status filter', null));
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
        // siloBaseUrl:
        //   typeof o.siloBaseUrl === 'string'
        //     ? o.siloBaseUrl.replace(/\blocalhost\b/g, clientHost)
        //     : o.siloBaseUrl,
      }))
    : orgs;

  return res
    .status(200)
    .json(new ApiResponse(200, 'OK', { orgs: normalizedOrgs }));
};
