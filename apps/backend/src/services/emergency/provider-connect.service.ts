import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
} from '@repo/db/schemas';

import { and, eq } from 'drizzle-orm';

import { logger } from '@/config/logger/winston.config';
import db from '@/db';
import { cacheProviderLocation } from '@/services/redis.service';

export interface ProviderConnectInput {
  requestId: string;
  providerId: string;
}

export interface ProviderConnectSuccess {
  outcome: 'connected';
  userId: string;
  roomName: string;
}

export type ProviderConnectResult =
  | ProviderConnectSuccess
  | { outcome: 'not_assigned'; message: string }
  | { outcome: 'not_found'; message: string };

export async function providerConnect(
  input: ProviderConnectInput
): Promise<ProviderConnectResult> {
  const { requestId, providerId } = input;

  const response = await db
    .select({
      id: emergencyResponse.id,
      requestId: emergencyResponse.emergencyRequestId,
      providerId: emergencyResponse.serviceProviderId,
    })
    .from(emergencyResponse)
    .where(
      and(
        eq(emergencyResponse.emergencyRequestId, requestId),
        eq(emergencyResponse.serviceProviderId, providerId)
      )
    )
    .limit(1);

  const request = await db
    .select({
      id: emergencyRequest.id,
      userId: emergencyRequest.userId,
      serviceType: emergencyRequest.serviceType,
      location: emergencyRequest.location,
      requestStatus: emergencyRequest.requestStatus,
    })
    .from(emergencyRequest)
    .where(eq(emergencyRequest.id, requestId))
    .limit(1);

  if (response.length === 0 || request.length === 0) {
    logger.error(
      `[ERROR] Provider ${providerId} not assigned to request ${requestId}`
    );
    return {
      outcome: 'not_assigned',
      message: 'You are not assigned to this request',
    };
  }

  const req = request[0];
  if (!req) {
    return { outcome: 'not_found', message: 'Request not found' };
  }

  await db
    .update(emergencyRequest)
    .set({
      providerConnectedAt: new Date().toISOString(),
      requestStatus: 'in_progress',
    })
    .where(eq(emergencyRequest.id, requestId));

  const roomName = `emergency:${requestId}`;
  logger.debug(`[ROOM] Provider ${providerId} joining room ${roomName}`);

  await db.insert(requestEvents).values({
    requestId,
    eventType: 'provider-connected',
    providerId,
    metadata: { connectedAt: new Date().toISOString() },
  });

  await cacheProviderLocation(providerId, {
    lat: 0,
    lng: 0,
    timestamp: Date.now(),
    requestId,
  });

  logger.debug(
    `[SUCCESS] Provider ${providerId} successfully connected to request ${requestId}`
  );

  return {
    outcome: 'connected',
    userId: req.userId,
    roomName,
  };
}
