import { user } from '@repo/db/schemas';

import { eq } from 'drizzle-orm';

import { logger } from '@/config';
import db from '@/db';

export interface UserLookupResult {
  found: boolean;
  user?: {
    id: string;
    name: string;
    phoneNumber: number;
    email: string;
    pushToken: string | null;
  };
  error?: string;
}

export async function findUserByPhoneNumber(
  phoneNumber: string
): Promise<UserLookupResult> {
  try {
    // remove all non-numeric characters except leading +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    const phoneNumeric = parseInt(cleaned, 10);

    if (isNaN(phoneNumeric)) {
      return {
        found: false,
        error: 'Invalid phone number format',
      };
    }

    const result = await db
      .select({
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        pushToken: user.pushToken,
      })
      .from(user)
      .where(eq(user.phoneNumber, phoneNumeric))
      .limit(1);

    if (result.length === 0) {
      return {
        found: false,
        error: 'User not found',
      };
    }

    return {
      found: true,
      user: result[0],
    };
  } catch (error) {
    logger.error('Error looking up user by phone number:', error);
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}

export async function findUserById(userId: string): Promise<UserLookupResult> {
  try {
    const result = await db
      .select({
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        email: user.email,
        pushToken: user.pushToken,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (result.length === 0) {
      return {
        found: false,
        error: 'User not found',
      };
    }

    return {
      found: true,
      user: result[0],
    };
  } catch (error) {
    logger.error('Error looking up user by ID:', error);
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}

export async function verifyUserIdentity(
  userId: string,
  phoneNumber: string
): Promise<{
  verified: boolean;
  user?: UserLookupResult['user'];
  error?: string;
}> {
  try {
    const userResult = await findUserById(userId);
    if (!userResult.found || !userResult.user) {
      return {
        verified: false,
        error: 'User ID not found in system',
      };
    }

    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    const phoneNumeric = parseInt(cleaned, 10);

    if (userResult.user.phoneNumber !== phoneNumeric) {
      logger.warn(
        `Phone mismatch: SMS from ${phoneNumber}, user registered with ${userResult.user.phoneNumber}`
      );
      return {
        verified: false,
        error: 'Phone number does not match registered user',
      };
    }

    return {
      verified: true,
      user: userResult.user,
    };
  } catch (error) {
    logger.error('Error verifying user identity:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification error',
    };
  }
}

export default {
  findUserByPhoneNumber,
  findUserById,
  verifyUserIdentity,
};
