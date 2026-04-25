import type { NextFunction, Request, Response } from 'express';

import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

// best-effort jwt decode. does not enforce authentication.
// global compliance middleware needs user so,
export async function populateUserFromToken(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token =
      (req.cookies?.token as string | undefined) ||
      (req.headers.authorization?.replace('Bearer ', '') as string | undefined);

    if (!token) return next();

    const decoded = await verifyAndDecodeToken(token);
    if (decoded) req.user = decoded;
  } catch {
    // ignore
  }

  next();
}
