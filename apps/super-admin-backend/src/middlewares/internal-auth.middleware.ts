import type { NextFunction, Request, Response } from 'express';

import { envConfig } from '@/config';

export function requireInternalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const key = req.headers['x-internal-api-key'];

  if (key !== envConfig.internal_api_key) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  next();
}
