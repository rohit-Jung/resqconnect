// TODO: Clean this cause we have a webhook setup now
import {
  emergencyRequest,
  outbox,
  serviceProvider,
  user,
} from '@repo/db/schemas';

import { eq, sql } from 'drizzle-orm';
import { latLngToCell } from 'h3-js';

import { envConfig, logger } from '@/config';
import {
  EMERGENCY_PHONE_NUMBER,
  FETCH_INTERVAL,
  H3_RESOLUTION,
  INITIAL_SEARCH_RADIUS,
  REQUEST_TIMEOUT_MS,
} from '@/constants';
import {
  AGGREGATE_TYPES,
  OUTBOX_EVENT_TYPES,
} from '@/constants/kafka.constants';
import db from '@/db';
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
  type ParsedEmergency,
  SMS_TEMPLATES,
  parseSMSMessage,
} from '@/utils/sms/sms.parser';

// Health check state
let lastPollTime: Date | null = null;
let pollCount = 0;
let errorCount = 0;
let messagesProcessed = 0;
let lastError: string | null = null;
let workerStartTime: Date | null = null;

async function processSingleMessage(message: TwilioMessage): Promise<{
  success: boolean;
  requestId?: string;
  error?: string;
}> {
  const { sid, body, from } = message;

  logger.info(`[WORKER] Processing SMS message ${sid} from ${from}`);

  // Parse the SMS message
  const parseResult = parseSMSMessage(body);

  if (!parseResult.success || !parseResult.data) {
    logger.warn(
      `[WORKER] Invalid SMS format from ${from}: ${parseResult.error}`
    );

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

  // Try to identify the user
  if (parsedData.userId) {
    // User ID provided in SMS - verify it matches the sender's phone
    const verification = await verifyUserIdentity(parsedData.userId, from);

    if (!verification.verified) {
      logger.warn(
        `[WORKER] User verification failed for ${from}: ${verification.error}`
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
      logger.warn(`[WORKER] User not found for phone number ${from}`);

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
      `[WORKER] Successfully processed SMS ${sid}, created request ${result.requestId}`
    );
    messagesProcessed++;

    return {
      success: true,
      requestId: result.requestId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[WORKER] Error processing SMS ${sid}:`, error);
    errorCount++;
    lastError = errorMessage;

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
    // get last poll timestamp for incremental fetching
    const lastPollTimeFromRedis = await getLastSMSPollTimestamp();
    logger.info(
      `[WORKER] Polling for SMS messages. Last poll: ${lastPollTimeFromRedis || 'never'}`
    );

    // fetch messages from twilio with error handling
    let messages: TwilioMessage[] = [];
    try {
      messages = await getMessages(
        toNumber,
        20,
        lastPollTimeFromRedis || undefined
      );
    } catch (twilioError) {
      logger.error(`[WORKER] Twilio API error fetching messages:`, twilioError);
      errorCount++;
      lastError =
        twilioError instanceof Error ? twilioError.message : 'Twilio API error';
      return;
    }

    if (messages.length === 0) {
      logger.debug(`[WORKER] No new messages in this poll`);
      return;
    }

    logger.info(`[WORKER] Fetched ${messages.length} SMS messages from Twilio`);

    // filter to only incoming messages (direction: 'inbound')
    const inboundMessages = messages.filter(msg => msg.direction === 'inbound');

    if (inboundMessages.length === 0) {
      logger.info(`[WORKER] No inbound messages in this batch`);
      // update poll timestamp even if no inbound messages
      await setLastSMSPollTimestamp(new Date());
      return;
    }

    logger.info(
      `[WORKER] Processing ${inboundMessages.length} inbound messages`
    );

    // batch check which messages have already been processed
    const messageSids = inboundMessages.map(m => m.sid);
    let processedMap: Map<string, boolean>;
    try {
      processedMap = await batchCheckMessagesProcessed(messageSids);
    } catch (redisError) {
      logger.error(
        `[WORKER] Redis error checking processed messages:`,
        redisError
      );
      errorCount++;
      lastError =
        redisError instanceof Error ? redisError.message : 'Redis error';
      // continue anyway - we might process duplicates but safety is preserved
      processedMap = new Map();
    }

    // filter out already processed messages
    const newMessages = inboundMessages.filter(
      msg => !processedMap.get(msg.sid)
    );

    if (newMessages.length === 0) {
      logger.info(
        `[WORKER] All ${inboundMessages.length} messages already processed`
      );
      try {
        await setLastSMSPollTimestamp(new Date());
      } catch (redisError) {
        logger.error(
          `[WORKER] Redis error updating poll timestamp:`,
          redisError
        );
      }
      return;
    }

    logger.info(`[WORKER] Found ${newMessages.length} new messages to process`);

    // process messages sequentially to avoid race conditions and db conflicts
    for (const message of newMessages) {
      try {
        await processSingleMessage(message);
      } catch (processError) {
        logger.error(
          `[WORKER] Unexpected error processing message ${message.sid}:`,
          processError
        );
        errorCount++;
        lastError =
          processError instanceof Error
            ? processError.message
            : 'Message processing error';
      }
    }

    // update last poll timestamp
    try {
      await setLastSMSPollTimestamp(new Date());
      lastPollTime = new Date();
      pollCount++;
      logger.info(`[WORKER] Poll cycle completed. Total polls: ${pollCount}`);
    } catch (redisError) {
      logger.error(
        `[WORKER] Redis error updating final poll timestamp:`,
        redisError
      );
    }
  } catch (error) {
    logger.error(`[WORKER] Unexpected error in message handling loop:`, error);
    errorCount++;
    lastError =
      error instanceof Error ? error.message : 'Unknown handling error';
  }
}

async function startSMSPollingWorker(): Promise<void> {
  const toNumber = envConfig.to_number;

  if (!toNumber) {
    logger.error(
      '[WORKER] SMS polling: TO_NUMBER not configured in environment'
    );
    return;
  }

  if (!envConfig.twilio_account_sid || !envConfig.twilio_auth_token) {
    logger.error('[WORKER] SMS polling: Twilio credentials not configured');
    return;
  }

  logger.info(`[WORKER] SMS Receiving Number: ${toNumber}`);
  logger.info(
    `[WORKER] Poll Interval: ${FETCH_INTERVAL}ms (${FETCH_INTERVAL / 1000} seconds)`
  );

  workerStartTime = new Date();
  pollCount = 0;
  errorCount = 0;
  messagesProcessed = 0;

  // initial fetch to verify twilio connection
  logger.info(`[WORKER] Running initial SMS poll to verify connectivity...`);
  try {
    await handleIncomingMessages(toNumber);
    logger.info(
      `[WORKER] Initial poll successful - SMS Polling Worker is active`
    );
  } catch (initialError) {
    logger.error(`[WORKER] Initial poll failed:`, initialError);
    errorCount++;
    lastError =
      initialError instanceof Error
        ? initialError.message
        : 'Initial poll failed';
    // continue anyway - worker will retry
  }

  // poll at interval with error recovery
  const pollIntervalId = setInterval(async () => {
    try {
      await handleIncomingMessages(toNumber);
    } catch (error) {
      logger.error(`[WORKER] Unhandled error in polling interval:`, error);
      errorCount++;
      lastError =
        error instanceof Error ? error.message : 'Polling interval error';
      // continue running - don't break the interval
    }
  }, FETCH_INTERVAL);

  // graceful shutdown handler
  process.on('SIGTERM', () => {
    logger.info(`[WORKER] Received SIGTERM - Stopping SMS Polling Worker`);
    clearInterval(pollIntervalId);
  });

  process.on('SIGINT', () => {
    logger.info(`[WORKER] Received SIGINT - Stopping SMS Polling Worker`);
    clearInterval(pollIntervalId);
  });
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

  // attribute to an org when possible so entitlements can enforce sms quota.
  // caller may not have org context; best-effort lookup by provider name.
  let organizationId: string | undefined;
  try {
    const provider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.name, providerName),
      columns: { organizationId: true },
    });
    organizationId = provider?.organizationId;
  } catch {
    // ignore; fall back to unmetered send
  }

  const result = await sendSMS(userPhone, message, { organizationId });
  return result.success;
}

// get health status of the sms polling worker
export function getSMSWorkerHealth() {
  const uptime = workerStartTime
    ? Date.now() - workerStartTime.getTime()
    : null;
  const avgPollDuration = pollCount > 0 ? (uptime ? uptime / pollCount : 0) : 0;

  return {
    status: workerStartTime ? 'running' : 'not_started',
    startTime: workerStartTime?.toISOString() || null,
    uptime: uptime ? `${Math.floor(uptime / 1000)}s` : null,
    pollCount,
    errorCount,
    messagesProcessed,
    lastPollTime: lastPollTime?.toISOString() || null,
    lastError,
    avgPollDuration: `${Math.round(avgPollDuration)}ms`,
    pollInterval: `${FETCH_INTERVAL}ms`,
    isHealthy: errorCount < pollCount * 0.1, // Healthy if error rate < 10%
  };
}

export {
  startSMSPollingWorker,
  handleIncomingMessages,
  processSingleMessage,
  SMS_TEMPLATES,
};

// Default export for worker entry point
export default startSMSPollingWorker;
