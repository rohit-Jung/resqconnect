import { cpAdmin } from '@repo/db/control-plane';

import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { db } from '@/db';
import type { AdminAuthContext } from '@/middlewares/admin-auth.middleware';
import { signAdminToken, verifyPassword } from '@/utils/auth';
import { adminLoginSchema } from '@/validations/auth.validation';

export const adminLogin = async (req: Request, res: Response) => {
  console.log('OKEY');
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Validation error',
      issues: parsed.error.issues.map(i => i.message),
    });
  }

  const admin = await db.query.cpAdmin.findFirst({
    where: eq(cpAdmin.email, parsed.data.email.toLowerCase()),
    columns: { id: true, email: true, passwordHash: true },
  });

  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const ok = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const token = signAdminToken({ sub: admin.id, email: admin.email });
  return res.status(200).json({
    ok: true,
    token,
    admin: { id: admin.id, email: admin.email },
  });
};

export const adminMe = async (req: Request, res: Response) => {
  const ctx = (req as any).auth as AdminAuthContext | undefined;
  if (!ctx?.admin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  return res.status(200).json({ ok: true, admin: ctx.admin });
};
