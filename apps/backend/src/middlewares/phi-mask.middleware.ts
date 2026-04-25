import { getSectorConfig } from '@repo/config';

import type { NextFunction, Request, Response } from 'express';

// hipaa response masking .
// we avoid changing controller code by patching `res.json` and redacting known fields.
function maskValue(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(maskValue);
  if (typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(record)) {
    const v = record[key];
    const lower = key.toLowerCase();

    // redact fields commonly containing phi/pii.
    if (
      lower.includes('phone') ||
      lower.includes('email') ||
      lower.includes('address') ||
      lower.includes('location') ||
      lower.includes('password') ||
      lower.includes('token')
    ) {
      out[key] = '[REDACTED]';
      continue;
    }

    out[key] = maskValue(v);
  }

  return out;
}

export function phiMaskMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const cfg = getSectorConfig();
  if (!cfg.compliance.hipaa) return next();

  // only mask responses intended for cross-silo/control-plane ingestion.
  // masking all api responses would break existing clients.
  const path = req.originalUrl ?? req.path;
  if (!path.startsWith('/api/v1/internal')) return next();

  const originalJson = res.json.bind(res);
  res.json = ((body?: any) => {
    // Preserve ApiResponse shape but redact inside `data`.
    if (body && typeof body === 'object' && 'data' in body) {
      const b = body as Record<string, unknown>;
      return originalJson({
        ...b,
        data: maskValue((b as any).data),
      });
    }

    return originalJson(maskValue(body));
  }) as any;

  next();
}
