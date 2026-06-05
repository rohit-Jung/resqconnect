import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
} from '@repo/db/schemas';

import { eq } from 'drizzle-orm';

import { logger } from '@/config/logger/winston.config';
import db from '@/db';

export interface CancelRequestInput {
  requestId: string;
  role: 'user' | 'provider';
}

export interface CancelRequestSuccess {
  outcome: 'cancelled';
  userId: string;
  serviceProviderId: string | null;
  cancelledAt: string;
}

export type CancelRequestResult =
  | CancelRequestSuccess
  | { outcome: 'not_found'; message: string }
  | { outcome: 'already_cancelled'; message: string };

export async function cancelRequest(
  input: CancelRequestInput
): Promise<CancelRequestResult> {
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

  if (emergReq.requestStatus === 'cancelled') {
    return {
      outcome: 'already_cancelled',
      message: 'Request is already cancelled',
    };
  }

  const cancelledAt = new Date().toISOString();

  await db.transaction(async tx => {
    await tx
      .update(emergencyRequest)
      .set({ requestStatus: 'cancelled', updatedAt: cancelledAt })
      .where(eq(emergencyRequest.id, requestId));

    await tx.insert(requestEvents).values({
      requestId,
      eventType: 'request_cancelled',
      providerId: undefined,
      metadata: { cancelledAt, cancelledBy: role },
    });
  });

  // Get provider ID from emergency response for notification routing
  const response = await db
    .select()
    .from(emergencyResponse)
    .where(eq(emergencyResponse.emergencyRequestId, requestId))
    .limit(1);

  const serviceProviderId =
    response.length > 0 ? (response[0]?.serviceProviderId ?? null) : null;

  logger.info(`[SUCCESS] Request ${requestId} cancelled by ${role}`);

  return {
    outcome: 'cancelled',
    userId: emergReq.userId,
    serviceProviderId,
    cancelledAt,
  };
}
