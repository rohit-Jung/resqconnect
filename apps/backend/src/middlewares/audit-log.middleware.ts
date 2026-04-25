import { getSectorConfig } from '@repo/config';

import type { NextFunction, Request, Response } from 'express';

import { writeAuditLog } from '@/services/audit-log.service';

// writes a minimal audit log row for each request.
// this should stay resilient: failures must not break request handling.
export function auditLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cfg = getSectorConfig();
  // only enabled for regulated sectors.
  if (!cfg.compliance.hipaa && !cfg.compliance.cjis) return next();

  res.on('finish', () => {
    // skip healthcheck routes.
    if ((req.originalUrl ?? req.path).includes('/healthcheck')) return;

    writeAuditLog({
      req,
      statusCode: res.statusCode,
    }).catch(() => {
      //  ignore
    });
  });

  next();
}
