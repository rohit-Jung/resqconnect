import { cpAdmin } from '@repo/db/control-plane';
import { ApiResponse, asyncHandler } from '@repo/utils/api';

import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';
import { signAdminToken, verifyPassword } from '@/utils/auth';
import { AppError } from '@/utils/errors';
import { adminLoginSchema } from '@/validations/auth.validation';

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw AppError.badRequest('Validation error');
  }

  const admin = await db.query.cpAdmin.findFirst({
    where: eq(cpAdmin.email, parsed.data.email.toLowerCase()),
    columns: { id: true, email: true, passwordHash: true },
  });

  if (!admin) throw AppError.unauthorized('Invalid credentials');

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) throw AppError.unauthorized('Invalid credentials');

  const token = signAdminToken({ sub: admin.id, email: admin.email });
  res.status(200).json(
    new ApiResponse(200, 'Login successful', {
      token,
      admin: { id: admin.id, email: admin.email },
    })
  );
});

export const adminMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.admin) throw AppError.unauthorized();
  res.status(200).json(new ApiResponse(200, 'OK', { admin: req.auth.admin }));
});
