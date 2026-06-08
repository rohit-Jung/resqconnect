import { serviceProvider } from '@repo/db/schemas';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

import db from '@/db';
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from '@/services/failed-login-lockout.service';
import { generateJWT } from '@/utils/tokens/jwtTokens';

export async function registerProvider(data: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  serviceType: string;
  organizationId: string;
}) {
  const hashed = await bcrypt.hash(data.password, 10);
  const [created] = await db
    .insert(serviceProvider)
    .values({
      name: data.name,
      email: data.email,
      password: hashed,
      phoneNumber: parseInt(data.phoneNumber) as any,
      serviceType: data.serviceType as any,
      organizationId: data.organizationId as any,
      age: 0 as any,
      primaryAddress: '',
      h3Index: BigInt(0) as any,
      currentLocation: { latitude: '27.7172', longitude: '85.3240' } as any,
      lastLocation: '0101000000E0BE0E9C33C04FC0' as any,
    })
    .returning({
      id: serviceProvider.id,
      name: serviceProvider.name,
      email: serviceProvider.email,
    });
  return created;
}

export async function loginProvider(email: string, password: string) {
  if (await isLoginLocked(email)) return { outcome: 'locked' as const };
  const provider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.email, email),
  });
  if (!provider) {
    await recordLoginFailure(email);
    return { outcome: 'invalid' as const };
  }
  if (!(await bcrypt.compare(password, provider.password))) {
    await recordLoginFailure(email);
    return { outcome: 'invalid' as const };
  }
  await clearLoginFailures(email);
  const token = generateJWT({ ...provider, kind: 'service_provider' });
  return {
    outcome: 'ok' as const,
    token,
    provider: {
      id: provider.id,
      name: provider.name,
      email: provider.email,
      serviceType: provider.serviceType,
      documentStatus: provider.documentStatus,
    },
  };
}

export async function updateProviderStatus(id: string, status: string) {
  await db
    .update(serviceProvider)
    .set({ serviceStatus: status as any })
    .where(eq(serviceProvider.id, id));
}

export async function updateProviderLocation(
  id: string,
  lat: number,
  lng: number
) {
  await db
    .update(serviceProvider)
    .set({
      currentLocation: { latitude: String(lat), longitude: String(lng) } as any,
    })
    .where(eq(serviceProvider.id, id));
}
