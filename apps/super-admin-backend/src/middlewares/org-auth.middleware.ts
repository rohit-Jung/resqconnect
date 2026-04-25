import { cpOrganization } from '@repo/db/control-plane';

import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { envConfig } from '@/config';
import { db } from '@/db';

export type OrgAuthContext = {
  org: {
    // Silo org ID (from JWT)
    siloOrgId: string;
    // Control-plane org registry ID
    cpOrgId: string;
  };
};

function bearerToken(req: Request) {
  const header = req.header('authorization') ?? '';
  const [kind, token] = header.split(' ');
  if (kind?.toLowerCase() !== 'bearer') return null;
  return token || null;
}

// Organization-web reuses silo org JWT for now.
// We verify it using the shared JWT secret and map siloOrgId -> cpOrgId.
export async function requireOrgAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing bearer token' });
  }

  try {
    const payload = jwt.verify(token, envConfig.jwt_secret) as any;
    const role = String(payload?.role ?? '').toLowerCase();
    if (role !== 'organization') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    const siloOrgId = String(payload?.id ?? '');
    if (!siloOrgId) {
      return res.status(401).json({ ok: false, error: 'Invalid token' });
    }

    const org = await db.query.cpOrganization.findFirst({
      where: eq(cpOrganization.siloOrgId, siloOrgId as any),
      columns: { id: true, siloOrgId: true },
    });

    if (!org?.id || !org.siloOrgId) {
      return res
        .status(404)
        .json({ ok: false, error: 'Org mapping not found' });
    }

    (req as any).auth = {
      org: {
        siloOrgId: String(org.siloOrgId),
        cpOrgId: String(org.id),
      },
    } satisfies OrgAuthContext;

    return next();
  } catch (err) {
    const isExpired =
      err instanceof jwt.TokenExpiredError ||
      (typeof err === 'object' &&
        err !== null &&
        (err as any).name === 'TokenExpiredError');
    return res.status(401).json({
      ok: false,
      error: isExpired ? 'Token expired' : 'Invalid token',
    });
  }
}
