import { eq, sql } from 'drizzle-orm';
import { latLngToCell } from 'h3-js';

import { envConfig, logger } from '@/config';
import {
  H3_RESOLUTION,
  INITIAL_SEARCH_RADIUS,
  REQUEST_TIMEOUT_MS,
} from '@/constants';
import {
  AGGREGATE_TYPES,
  EVENT_TYPES,
  OUTBOX_EVENT_TYPES,
} from '@/constants/kafka.constants';
import db from '@/db';
import { emergencyRequest, outbox, user } from '@/models';
import { publishWithRetry } from '@/services/kafka/kafka.utils';
import {
  batchCheckMessagesProcessed,
  getLastSMSPollTimestamp,
  markMessageProcessed,
  setLastSMSPollTimestamp,
} from '@/services/redis.service';
import {
  type TwilioMessage,
  getMessages,
  sendSMS,
} from '@/services/twilio.service';
import {
  findUserByPhoneNumber,
  verifyUserIdentity,
} from '@/services/user.service';
import { getKafkaTopic } from '@/utils';
import {
  type ParsedSMSEmergency,
  SMS_TEMPLATES,
  parseSMSMessage,
} from '@/utils/sms/sms.parser';

// Polling interval in milliseconds
const FETCH_INTERVAL = 3000;

// Emergency phone number for fallback
const EMERGENCY_PHONE_NUMBER = envConfig.emergency_phone_number || '112';

async function processSingleMessage(message: TwilioMessage): Promise<{
  success: boolean;
  requestId?: string;
  error?: string;
}> {
  const { sid, body, from } = message;

  logger.info(`Processing SMS message ${sid} from ${from}`);

  // Parse the SMS message
  const parseResult = parseSMSMessage(body);

  if (!parseResult.success || !parseResult.data) {
    logger.warn(`Invalid SMS format from ${from}: ${parseResult.error}`);

    // Mark as processed with invalid status
    await markMessageProcessed(sid, {
      status: 'invalid',
      error: parseResult.error,
    });

    // Don't send error SMS for non-emergency messages (spam filter)
    return {
      success: false,
      error: parseResult.error,
    };
  }

  const parsedData = parseResult.data;
  let userId: string;
  const userPhone: string = from;

  // Try to identify the user
  if (parsedData.userId) {
    // User ID provided in SMS - verify it matches the sender's phone
    const verification = await verifyUserIdentity(parsedData.userId, from);

    if (!verification.verified) {
      logger.warn(
        `User verification failed for ${from}: ${verification.error}`
      );

      await markMessageProcessed(sid, {
        status: 'failed',
        error: verification.error,
      });

      // Send error SMS
      await sendSMS(
        from,
        SMS_TEMPLATES.REQUEST_FAILED(
          'User verification failed. Your phone number does not match the registered user.',
          EMERGENCY_PHONE_NUMBER
        )
      );

      return {
        success: false,
        error: verification.error,
      };
    }

    userId = parsedData.userId;
  } else {
    // No user ID provided - look up by phone number
    const userResult = await findUserByPhoneNumber(from);

    if (!userResult.found || !userResult.user) {
      logger.warn(`User not found for phone number ${from}`);

      await markMessageProcessed(sid, {
        status: 'failed',
        error: 'User not found',
      });

      // Send error SMS
      await sendSMS(from, SMS_TEMPLATES.USER_NOT_FOUND(EMERGENCY_PHONE_NUMBER));

      return {
        success: false,
        error: 'User not found',
      };
    }

    userId = userResult.user.id;
  }

  // Create the emergency request
  try {
    const result = await createEmergencyRequest(userId, parsedData);

    if (!result.success || !result.requestId) {
      await markMessageProcessed(sid, {
        userId,
        status: 'failed',
        error: result.error,
      });

      await sendSMS(
        from,
        SMS_TEMPLATES.REQUEST_FAILED(
          result.error || 'Failed to create request',
          EMERGENCY_PHONE_NUMBER
        )
      );

      return {
        success: false,
        error: result.error,
      };
    }

    // Mark as successfully processed
    await markMessageProcessed(sid, {
      requestId: result.requestId,
      userId,
      status: 'success',
    });

    // Send confirmation SMS
    const emergencyTypeDisplay = formatEmergencyType(parsedData.emergencyType);
    await sendSMS(
      from,
      SMS_TEMPLATES.REQUEST_RECEIVED(result.requestId, emergencyTypeDisplay)
    );

    logger.info(
      `Successfully processed SMS ${sid}, created request ${result.requestId}`
    );

    return {
      success: true,
      requestId: result.requestId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error processing SMS ${sid}:`, error);

    await markMessageProcessed(sid, {
      userId,
      status: 'failed',
      error: errorMessage,
    });

    await sendSMS(
      from,
      SMS_TEMPLATES.REQUEST_FAILED(
        'An unexpected error occurred',
        EMERGENCY_PHONE_NUMBER
      )
    );

    return {
      success: false,
      error: errorMessage,
    };
  }
}

async function createEmergencyRequest(
  userId: string,
  data: ParsedSMSEmergency
): Promise<{
  success: boolean;
  requestId?: string;
  error?: string;
}> {
  const { emergencyType, location, description } = data;

  // Convert location to H3 index
  const h3Index = latLngToCell(
    location.latitude,
    location.longitude,
    H3_RESOLUTION
  );

  const h3IndexBigInt = BigInt(`0x${h3Index}`);
  const locationPoint = `POINT(${location.longitude} ${location.latitude})`;

  // Calculate expiry time
  const expiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);

  try {
    // Database transaction for atomicity
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

      // Create outbox event (Outbox pattern for Kafka)
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
        source: 'sms', // Mark as SMS-originated request
      };

      await tx.insert(outbox).values({
        aggregateId: newRequest.id,
        aggregateType: AGGREGATE_TYPES.EMERGENCY_REQUEST,
        eventType: OUTBOX_EVENT_TYPES.CREATED,
        kafkaTopic: getKafkaTopic(emergencyType),
        payload: JSON.stringify(eventPayload),
        status: 'pending',
      });

      // Update user's current location
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

    // Try to publish to Kafka immediately
    const kafkaTopic = getKafkaTopic(emergencyType);
    const published = await publishWithRetry(kafkaTopic, {
      key: result.id,
      value: JSON.stringify({
        type: EVENT_TYPES.REQUEST_CREATED,
        requestId: result.id,
        userId: result.userId,
        emergencyType: result.emergencyType,
        emergencyDescription: result.emergencyDescription,
        emergencyLocation: result.emergencyLocation,
        status: result.status,
        h3Index: h3Index,
        searchRadius: result.searchRadius,
        expiresAt: result.expiresAt,
        source: 'sms',
      }),
    });

    if (published) {
      // Mark outbox event as published
      await db
        .update(outbox)
        .set({ status: 'published', publishedAt: new Date().toISOString() })
        .where(eq(outbox.aggregateId, result.id));
    } else {
      logger.warn(
        `Kafka unavailable, event queued in outbox for request ${result.id}`
      );
    }

    return {
      success: true,
      requestId: result.id,
    };
  } catch (error) {
    logger.error('Error creating emergency request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database error',
    };
  }
}

function formatEmergencyType(type: string): string {
  const types: Record<string, string> = {
    ambulance: 'Medical/Ambulance',
    police: 'Police',
    fire_truck: 'Fire',
    rescue_team: 'Rescue',
  };
  return types[type] || type;
}

async function handleIncomingMessages(toNumber: string): Promise<void> {
  try {
    // Get last poll timestamp for incremental fetching
    const lastPollTime = await getLastSMSPollTimestamp();

    // Fetch messages from Twilio
    const messages = await getMessages(toNumber, 20, lastPollTime || undefined);

    if (messages.length === 0) {
      return;
    }

    logger.info(`Fetched ${messages.length} SMS messages`);

    // Filter to only incoming messages (direction: 'inbound')
    const inboundMessages = messages.filter(msg => msg.direction === 'inbound');

    if (inboundMessages.length === 0) {
      // Update poll timestamp even if no inbound messages
      await setLastSMSPollTimestamp(new Date());
      return;
    }

    // Batch check which messages have already been processed
    const messageSids = inboundMessages.map(m => m.sid);
    const processedMap = await batchCheckMessagesProcessed(messageSids);

    // Filter out already processed messages
    const newMessages = inboundMessages.filter(
      msg => !processedMap.get(msg.sid)
    );

    if (newMessages.length === 0) {
      logger.info('All fetched messages already processed');
      await setLastSMSPollTimestamp(new Date());
      return;
    }

    logger.info(`Processing ${newMessages.length} new SMS messages`);

    // Process messages sequentially to avoid race conditions
    for (const message of newMessages) {
      await processSingleMessage(message);
    }

    // Update last poll timestamp
    await setLastSMSPollTimestamp(new Date());
  } catch (error) {
    logger.error('Error fetching/processing SMS messages:', error);
  }
}

async function startSMSPollingWorker(): Promise<void> {
  const toNumber = envConfig.to_number;

  if (!toNumber) {
    logger.error('SMS polling: TO_NUMBER not configured in environment');
    return;
  }

  logger.info(`Starting SMS polling worker for number: ${toNumber}`);
  logger.info(`Poll interval: ${FETCH_INTERVAL}ms`);

  // Initial fetch
  await handleIncomingMessages(toNumber);

  // Poll at interval
  setInterval(async () => {
    await handleIncomingMessages(toNumber);
  }, FETCH_INTERVAL);
}

export async function notifyUserViaSmS(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  const result = await sendSMS(phoneNumber, message);
  return result.success;
}

export async function sendProviderAssignedSMS(
  userPhone: string,
  emergencyType: string,
  providerName: string
): Promise<boolean> {
  const message = SMS_TEMPLATES.PROVIDER_ASSIGNED(
    formatEmergencyType(emergencyType),
    providerName
  );
  const result = await sendSMS(userPhone, message);
  return result.success;
}

export {
  startSMSPollingWorker,
  handleIncomingMessages,
  processSingleMessage,
  createEmergencyRequest,
  SMS_TEMPLATES,
};

// Default export for worker entry point
export default startSMSPollingWorker;
