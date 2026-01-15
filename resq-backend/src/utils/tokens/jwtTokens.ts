import { eq, sql } from 'drizzle-orm';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { envConfig } from '@/config/env.config';
import { UserRoles } from '@/constants';
import db from '@/db';
import { organization, serviceProvider, user } from '@/models';
import type { TOrganization, TServiceProvider, TUser } from '@/models';

import ApiError from '../api/ApiError';

type EntityRole = UserRoles | 'service_provider' | 'organization';
export interface IJWTToken extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: EntityRole;
  iat?: number;
  exp?: number;
}

type Entity =
  | Partial<TUser & { kind: 'user' }>
  | Partial<TServiceProvider & { kind: 'service_provider' }>
  | Partial<TOrganization & { kind: 'organization' }>;

const getRole = (e: Entity): EntityRole => {
  switch (e.kind) {
    case 'user':
      return e.role as UserRoles;
    case 'service_provider':
      return 'service_provider';
    case 'organization':
      return 'organization';
    default:
      return UserRoles.USER;
  }
};

const generateJWT = (user: Entity) => {
  if (!envConfig.jwt_secret) {
    throw new Error('JWT secret not found in environment variables');
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: getRole(user),
    },
    envConfig.jwt_secret!,
    {
      expiresIn: envConfig.jwt_expiry,
    },
  );

  return token;
};

const verifyJWT = (token: string): IJWTToken => {
  if (!envConfig.jwt_secret) {
    throw new Error('JWT secret not found in environment variables');
  }

  const decoded = jwt.verify(token, envConfig.jwt_secret!) as IJWTToken;

  if (!decoded.id) {
    throw new ApiError(401, 'Invalid token');
  }

  return decoded;
};

const verifyAndDecodeToken = async (
  token: string,
): Promise<IJWTToken | null> => {
  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }

  const decoded = verifyJWT(token);
  if (!decoded.id) {
    throw new ApiError(401, 'Invalid token');
  }

  const [row] = await db
    .select({
      id: user.id,
      role: sql<EntityRole>`${user.role}::text`,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, decoded.id))
    .union(
      db
        .select({
          id: serviceProvider.id,
          role: sql<EntityRole>`'serviceProvider'`,
          name: serviceProvider.name,
          email: serviceProvider.email,
        })
        .from(serviceProvider)
        .where(eq(serviceProvider.id, decoded.id)),
    )
    .union(
      db
        .select({
          id: organization.id,
          role: sql<EntityRole>`'organization'`,
          name: organization.name,
          email: organization.email,
        })
        .from(organization)
        .where(eq(organization.id, decoded.id)),
    )
    .limit(1);

  return row || null;
};

export { generateJWT, verifyJWT, verifyAndDecodeToken };
