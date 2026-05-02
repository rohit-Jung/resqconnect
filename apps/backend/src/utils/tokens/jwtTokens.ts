import { organization, serviceProvider, user } from '@repo/db/schemas';
import type { TOrganization, TServiceProvider, TUser } from '@repo/db/schemas';

import { eq, sql } from 'drizzle-orm';
import jwt, {
  JsonWebTokenError,
  type JwtPayload,
  TokenExpiredError,
} from 'jsonwebtoken';

import { envConfig } from '@/config';
import { OtherRoles, UserRoles } from '@/constants';
import db from '@/db';

import ApiError from '../api/ApiError';

export type TEntityRole = UserRoles | OtherRoles;
export interface IJWTToken extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: TEntityRole;
  restricted?: boolean;
  // Only used for organization tokens.
  orgStatus?: string;
  iat?: number;
  exp?: number;
}

type Entity =
  | Partial<TUser & { kind: 'user' }>
  | Partial<TServiceProvider & { kind: 'service_provider' }>
  | Partial<TOrganization & { kind: 'organization' }>;

type JWTOptions = {
  restricted?: boolean;
  orgStatus?: string;
};

const getRole = (e: Entity): TEntityRole => {
  switch (e.kind) {
    case 'user':
      return e.role as UserRoles;
    case 'service_provider':
      return OtherRoles.SERVICE_PROVIDER;
    case 'organization':
      return OtherRoles.ORGANIZATION;
    default:
      return UserRoles.USER;
  }
};

const generateJWT = (user: Entity, options: JWTOptions = {}) => {
  if (!envConfig.jwt_secret) {
    throw new Error('JWT secret not found in environment variables');
  }

  const expiresIn = options.restricted
    ? envConfig.jwt_restricted_expiry
    : envConfig.jwt_expiry;

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: getRole(user),
      ...(options.restricted ? { restricted: true } : null),
      ...(options.orgStatus ? { orgStatus: options.orgStatus } : null),
    },
    envConfig.jwt_secret!,
    {
      expiresIn,
    }
  );

  return token;
};

const verifyJWT = (token: string): IJWTToken => {
  if (!envConfig.jwt_secret) {
    throw new Error('JWT secret not found in environment variables');
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwt_secret!) as IJWTToken;

    if (!decoded.id) {
      throw ApiError.unauthorized('Invalid token');
    }

    return decoded;
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof TokenExpiredError) {
      throw ApiError.unauthorized('Token expired');
    }
    if (error instanceof JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid token');
    }
    // Re-throw ApiError as is
    if (error instanceof ApiError) {
      throw error;
    }
    // Unknown error
    throw ApiError.unauthorized('Token verification failed');
  }
};

const verifyAndDecodeToken = async (
  token: string
): Promise<IJWTToken | null> => {
  if (!token) {
    throw ApiError.unauthorized('Unauthorized');
  }

  const decoded = verifyJWT(token);
  if (!decoded.id) {
    throw ApiError.unauthorized('Invalid token');
  }

  const [row] = await db
    .select({
      id: user.id,
      role: sql<TEntityRole>`${user.role}::text`,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, decoded.id))
    .union(
      db
        .select({
          id: serviceProvider.id,
          role: sql<TEntityRole>`'service_provider'`,
          name: serviceProvider.name,
          email: serviceProvider.email,
        })
        .from(serviceProvider)
        .where(eq(serviceProvider.id, decoded.id))
    )
    .union(
      db
        .select({
          id: organization.id,
          role: sql<TEntityRole>`'organization'`,
          name: organization.name,
          email: organization.email,
        })
        .from(organization)
        .where(eq(organization.id, decoded.id))
    )
    .limit(1);

  if (!row) return null;

  // Merge DB-validated identity with JWT claims.
  // Keep compliance-related claims from the JWT.
  return {
    ...row,
    restricted: decoded.restricted,
    orgStatus: decoded.orgStatus,
    iat: decoded.iat,
    exp: decoded.exp,
  } as IJWTToken;
};

export { generateJWT, verifyJWT, verifyAndDecodeToken };
