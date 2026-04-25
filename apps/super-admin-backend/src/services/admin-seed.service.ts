import { cpAdmin } from '@repo/db/control-plane';

import { eq } from 'drizzle-orm';

import { envConfig } from '@/config';
import { db } from '@/db';
import { hashPassword } from '@/utils/auth';

export async function ensureSeedAdmin() {
  const email = envConfig.control_plane_admin_email.toLowerCase();
  const passwordHash = await hashPassword(
    envConfig.control_plane_admin_password
  );

  const existing = await db.query.cpAdmin.findFirst({
    where: eq(cpAdmin.email, email),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(cpAdmin)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(cpAdmin.email, email));
    return;
  }

  await db.insert(cpAdmin).values({ email, passwordHash });
  console.log('OK CREATED');
}
