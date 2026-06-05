import { emergencyRequest, requestEvents } from '@repo/db/schemas';

import { eq } from 'drizzle-orm';
import { latLngToCell } from 'h3-js';

import { logger } from '@/config/logger/winston.config';
import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import db from '@/db';
import { publishWithRetry } from '@/services/kafka/kafka.utils';

const SERVICE_TYPE_TOPIC: Record<string, KAFKA_TOPICS> = {
  ambulance: KAFKA_TOPICS.MEDICAL_EVENTS,
  police: KAFKA_TOPICS.POLICE_EVENTS,
  fire_truck: KAFKA_TOPICS.FIRE_EVENTS,
  rescue_team: KAFKA_TOPICS.RESCUE_EVENTS,
};

export interface RejectRequestInput {
  requestId: string;
  providerId: string;
}

export type RejectRequestResult =
  | { outcome: 'rejected' }
  | { outcome: 'not_found' };

export async function rejectRequest(
  input: RejectRequestInput
): Promise<RejectRequestResult> {
  const { requestId, providerId } = input;

  const req = await db.query.emergencyRequest.findFirst({
    where: eq(emergencyRequest.id, requestId),
  });

  if (!req) {
    logger.warn(`[REJECT] Request ${requestId} not found`);
    return { outcome: 'not_found' };
  }

  const topic = SERVICE_TYPE_TOPIC[req.serviceType];

  await Promise.all([
    db.insert(requestEvents).values({
      requestId,
      eventType: 'rejected',
      providerId,
      metadata: { rejectedAt: new Date().toISOString() },
    }),
    db
      .update(emergencyRequest)
      .set({ requestStatus: 'pending' })
      .where(eq(emergencyRequest.id, requestId)),
  ]);

  // Republish to Kafka so other silo orgs can consume the request
  if (topic && req.location) {
    const h3Index = latLngToCell(
      req.location.latitude,
      req.location.longitude,
      8
    );
    const payload = JSON.stringify({
      requestId: req.id,
      userId: req.userId,
      emergencyType: req.serviceType,
      emergencyLocation: {
        latitude: req.location.latitude,
        longitude: req.location.longitude,
      },
      status: 'pending',
      h3Index,
      emergencyDescription: req.description ?? undefined,
      expiresAt: req.expiresAt ?? undefined,
    });

    const published = await publishWithRetry(topic, {
      key: requestId,
      value: payload,
    });
    if (published) {
      logger.info(
        `[REJECT] Republished request ${requestId} to topic ${topic}`
      );
    } else {
      logger.error(
        `[REJECT] Failed to republish request ${requestId} to Kafka after retries`
      );
    }
  }

  return { outcome: 'rejected' };
}
