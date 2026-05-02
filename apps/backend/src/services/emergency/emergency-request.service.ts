import { emergencyRequest, outbox, user } from '@repo/db/schemas';

import { eq, sql } from 'drizzle-orm';
import { latLngToCell } from 'h3-js';

import { logger } from '@/config';
import {
  H3_RESOLUTION,
  INITIAL_SEARCH_RADIUS,
  REQUEST_TIMEOUT_MS,
} from '@/constants';
import {
  AGGREGATE_TYPES,
  OUTBOX_EVENT_TYPES,
} from '@/constants/kafka.constants';
import db from '@/db';
import { getKafkaTopic } from '@/utils';
import type { ParsedEmergency } from '@/utils/sms/sms.parser';

async function create(
  userId: string,
  data: ParsedEmergency,
  source: 'sms' | 'inapp' = 'sms'
): Promise<{
  success: boolean;
  requestId?: string;
  error?: string;
  requestInfo?: any;
}> {
  const { emergencyType, location, description } = data;

  logger.info(
    `[WORKER] Creating emergency request for user ${userId}, type: ${emergencyType}`
  );

  // convert location to h3 index
  const h3Index = latLngToCell(
    location.latitude,
    location.longitude,
    H3_RESOLUTION
  );

  const h3IndexBigInt = BigInt(`0x${h3Index}`);
  const locationPoint = `POINT(${location.longitude} ${location.latitude})`;

  // calculate expiry time
  const expiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);

  try {
    // database transaction for atomicity
    const result = await db.transaction(async tx => {
      const [newRequest] = await tx
        .insert(emergencyRequest)
        .values({
          userId,
          serviceType: emergencyType,
          description: description || 'Emergency request via SMS (offline)',
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          geoLocation: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
          h3Index: h3IndexBigInt,
          searchRadius: INITIAL_SEARCH_RADIUS,
          expiresAt: expiresAt.toISOString(),
          requestStatus: 'pending',
        })
        .returning({
          id: emergencyRequest.id,
          userId: emergencyRequest.userId,
          emergencyType: emergencyRequest.serviceType,
          emergencyDescription: emergencyRequest.description,
          emergencyLocation: emergencyRequest.location,
          status: emergencyRequest.requestStatus,
          searchRadius: emergencyRequest.searchRadius,
          expiresAt: emergencyRequest.expiresAt,
        });

      if (!newRequest?.id) {
        throw new Error('Failed to create emergency request');
      }

      logger.info(`[WORKER] Created emergency request ${newRequest.id}`);

      // create outbox event (outbox pattern for kafka)
      const eventPayload = {
        requestId: newRequest.id,
        userId: newRequest.userId,
        emergencyType: newRequest.emergencyType,
        emergencyDescription: newRequest.emergencyDescription,
        emergencyLocation: newRequest.emergencyLocation,
        status: newRequest.status,
        h3Index: h3Index, // Send hex string
        searchRadius: newRequest.searchRadius,
        expiresAt: newRequest.expiresAt,
        source, // Mark as SMS-originated request
      };

      await tx.insert(outbox).values({
        aggregateId: newRequest.id,
        aggregateType: AGGREGATE_TYPES.EMERGENCY_REQUEST,
        eventType: OUTBOX_EVENT_TYPES.CREATED,
        kafkaTopic: getKafkaTopic(emergencyType),
        payload: JSON.stringify(eventPayload),
        status: 'pending',
      });

      // update user's current location
      await tx
        .update(user)
        .set({
          currentLocation: {
            latitude: location.latitude.toString(),
            longitude: location.longitude.toString(),
          },
        })
        .where(eq(user.id, userId));

      return newRequest;
    });

    return {
      success: true,
      requestId: result.id,
      requestInfo: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Database error';
    logger.error(`[WORKER] Error creating emergency request:`, error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

const emergencyRequestService = {
  create,
};

export default emergencyRequestService;
