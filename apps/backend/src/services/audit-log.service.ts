import { auditLog } from '@repo/db/schemas';

import type { Request } from 'express';

import db from '@/db';

function getRequestIp(req: Request): string | undefined {
  // Best-effort; trusted proxy setup is outside scope.
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.ip;
}

function actorTypeFromRole(
  role?: string
):
  | 'user'
  | 'service_provider'
  | 'organization'
  | 'admin'
  | 'internal'
  | 'anonymous' {
  if (!role) return 'anonymous';
  if (role === 'admin') return 'admin';
  if (role === 'user') return 'user';
  if (role === 'service_provider') return 'service_provider';
  if (role === 'organization') return 'organization';
  return 'anonymous';
}

export async function writeAuditLog(params: {
  req: Request;
  statusCode: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { req, statusCode, metadata } = params;

  const role = req.user?.role?.toString();
  const actorType = actorTypeFromRole(role);

  // Only orgs have an inherent orgId; for other actors we can optionally
  // include organizationId in metadata from controllers later if needed.
  const organizationId = role === 'organization' ? req.user?.id : undefined;

  await db.insert(auditLog).values({
    actorType: actorType as any,
    actorId: req.user?.id ?? null,
    method: req.method,
    path: req.originalUrl ?? req.path,
    statusCode: String(statusCode),
    ip: getRequestIp(req) ?? null,
    userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
    organizationId: organizationId ?? null,
    metadata: metadata ?? {},
  });
}
