import { organization } from '@repo/db/schemas';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import db from '@/db';
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from '@/services/failed-login-lockout.service';
import { generateJWT } from '@/utils/tokens/jwtTokens';

export async function registerOrg(data: {
  name: string;
  email: string;
  password: string;
  serviceCategory: string;
  generalNumber: string;
}) {
  const hashed = await bcrypt.hash(data.password, 10);
  const [created] = await db
    .insert(organization)
    .values({
      name: data.name,
      email: data.email,
      password: hashed,
      serviceCategory: data.serviceCategory as any,
      generalNumber: Number(data.generalNumber) as any,
    })
    .returning({
      id: organization.id,
      name: organization.name,
      email: organization.email,
    });
  return created;
}

export async function loginOrg(email: string, password: string) {
  if (await isLoginLocked(email)) return { outcome: 'locked' as const };
  const org = await db.query.organization.findFirst({
    where: eq(organization.email, email),
  });
  if (!org) {
    await recordLoginFailure(email);
    return { outcome: 'invalid' as const };
  }
  if (!(await bcrypt.compare(password, org.password))) {
    await recordLoginFailure(email);
    return { outcome: 'invalid' as const };
  }
  await clearLoginFailures(email);
  const token = generateJWT({ ...org, kind: 'organization' });
  return {
    outcome: 'ok' as const,
    token,
    org: {
      id: org.id,
      name: org.name,
      email: org.email,
      serviceCategory: org.serviceCategory,
      isVerified: org.isVerified ?? false,
      lifecycleStatus: org.lifecycleStatus ?? 'pending_approval',
    },
  };
}

export async function getOrgProfile(orgId: string) {
  return db.query.organization.findFirst({
    where: eq(organization.id, orgId),
    columns: {
      id: true,
      name: true,
      email: true,
      serviceCategory: true,
      generalNumber: true,
      isVerified: true,
      lifecycleStatus: true,
      logo: true,
    },
  });
}
