import {
  emergencyRequest,
  emergencyResponse,
  serviceProvider,
} from '@repo/db/schemas';

import { eq } from 'drizzle-orm';

import { logger } from '@/config/logger/winston.config';
import db from '@/db';

export interface UserJoinRoomInput {
  requestId: string;
  userId: string;
}

export interface UserJoinRoomSuccess {
  outcome: 'joined';
  providerId: string | null;
  providerLocation: { latitude: string; longitude: string } | null;
  emergencyLocation: { latitude: number; longitude: number } | null;
  emergencyType: string | null;
  requestStatus: string | null;
}

export type UserJoinRoomResult =
  | UserJoinRoomSuccess
  | { outcome: 'not_found'; message: string };

export async function userJoinRoom(
  input: UserJoinRoomInput
): Promise<UserJoinRoomResult> {
  const { requestId, userId } = input;

  const request = await db
    .select()
    .from(emergencyRequest)
    .where(eq(emergencyRequest.id, requestId))
    .limit(1);

  if (request.length === 0) {
    return { outcome: 'not_found', message: 'Emergency request not found' };
  }

  const emergReq = request[0]!;

  const response = await db
    .select()
    .from(emergencyResponse)
    .where(eq(emergencyResponse.emergencyRequestId, requestId))
    .limit(1);

  let providerId: string | null = null;
  let providerLocation: { latitude: string; longitude: string } | null = null;

  if (response.length > 0) {
    const resp = response[0]!;
    providerId = resp.serviceProviderId;

    if (resp.serviceProviderId) {
      const provider = await db.query.serviceProvider.findFirst({
        where: eq(serviceProvider.id, resp.serviceProviderId),
      });
      providerLocation = provider?.currentLocation ?? null;
    }
  }

  logger.debug(`[ROOM] User ${userId} joined room for request ${requestId}`);

  return {
    outcome: 'joined',
    providerId,
    providerLocation,
    emergencyLocation: emergReq.location,
    emergencyType: emergReq.serviceType,
    requestStatus: emergReq.requestStatus,
  };
}
