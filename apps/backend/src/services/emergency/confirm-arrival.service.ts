import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
  serviceProvider,
} from '@repo/db/schemas';

import { eq } from 'drizzle-orm';

import { logger } from '@/config/logger/winston.config';
import db from '@/db';

export interface ConfirmArrivalInput {
  requestId: string;
  role: 'user' | 'provider';
}

export interface ConfirmArrivalSuccess {
  outcome: 'completed';
  userId: string;
  serviceProviderId: string | null;
  completedAt: string;
}

export type ConfirmArrivalResult =
  | ConfirmArrivalSuccess
  | { outcome: 'not_found'; message: string }
  | { outcome: 'no_provider'; message: string };

export async function confirmArrival(
  input: ConfirmArrivalInput
): Promise<ConfirmArrivalResult> {
  const { requestId, role } = input;

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

  if (response.length === 0) {
    return {
      outcome: 'no_provider',
      message: 'No provider assigned to this request',
    };
  }

  const emergResp = response[0]!;
  const completedAt = new Date().toISOString();

  await db.transaction(async tx => {
    await tx
      .update(emergencyRequest)
      .set({ requestStatus: 'completed', updatedAt: completedAt })
      .where(eq(emergencyRequest.id, requestId));

    await tx
      .update(emergencyResponse)
      .set({ statusUpdate: 'arrived', updatedAt: completedAt })
      .where(eq(emergencyResponse.id, emergResp.id));

    if (emergResp.serviceProviderId) {
      await tx
        .update(serviceProvider)
        .set({ serviceStatus: 'available' })
        .where(eq(serviceProvider.id, emergResp.serviceProviderId));
    }

    await tx.insert(requestEvents).values({
      requestId,
      eventType: 'completed',
      providerId: emergResp.serviceProviderId,
      metadata: { completedAt, completedBy: role },
    });
  });

  logger.info(
    `[COMPLETED] Request ${requestId} marked as completed by ${role}`
  );

  return {
    outcome: 'completed',
    userId: emergReq.userId,
    serviceProviderId: emergResp.serviceProviderId,
    completedAt,
  };
}
