import axios, { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';

import { envConfig, logger } from '@/config';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { SMS_TEMPLATES, parseSMSMessage } from '@/utils/sms/sms.parser';
import {
  Events,
  EventsEnum,
  type SmsGatewayInterface,
} from '@/validations/messages.validations';
import { createEmergencyRequest } from '@/workers/messaging.worker';

import { SmsRoutes, postSMS, sendLocalSMS } from './local-sms.service';
import { markMessageProcessed } from './redis.service';
import { sendSMS } from './twilio.service';
import { findUserByPhoneNumber, verifyUserIdentity } from './user.service';

const EMERGENCY_PHONE_NUMBER = envConfig.emergency_phone_number || '112';

const handleSmsWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { payload, deviceId, event, id } = req.body as SmsGatewayInterface;
  console.log('RECEIVED a hit');

  if (event != Events.SmsReceived) {
    return res.json(
      new ApiResponse(
        HttpStatusCode.BadRequest,
        `Incorrect Event Detected, Event should be ${Events.SmsReceived}`,
        req.body
      )
    );
  }

  // const messageSids = inboundMessages.map(m => m.sid);
  // let processedMap: Map<string, boolean>;
  // try {
  //   processedMap = await batchCheckMessagesProcessed(messageSids);
  // } catch (redisError) {
  //   logger.error(
  //     `[WORKER] Redis error checking processed messages:`,
  //     redisError
  //   );
  //   errorCount++;
  //   lastError =
  //     redisError instanceof Error ? redisError.message : 'Redis error';
  //   // Continue anyway - we might process duplicates but safety is preserved
  //   processedMap = new Map();
  // }

  logger.info(
    `[SMS WEBHOOK] Processing SMS message ${id} from ${payload.sender}`
  );

  // Parse the SMS message
  const parseResult = parseSMSMessage(payload.message);

  if (!parseResult.success || !parseResult.data) {
    logger.warn(
      `[SMS WEBHOOK] Invalid SMS format from ${payload.sender}: ${parseResult.error}`
    );

    // Mark as processed with invalid status
    await markMessageProcessed(id, {
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
  const userPhone: string = payload.sender;

  // Try to identify the user
  if (parsedData.userId) {
    // User ID provided in SMS - verify it matches the sender's phone
    const verification = await verifyUserIdentity(parsedData.userId, userPhone);
    if (!verification.verified) {
      logger.warn(
        `[SMS WEBHOOK] User verification failed for ${payload.sender}: ${verification.error}`
      );

      await markMessageProcessed(id, {
        status: 'failed',
        error: verification.error,
      });

      // Send error SMS
      await sendLocalSMS(
        payload.sender,
        SMS_TEMPLATES.REQUEST_FAILED(
          'User verification failed. Your phone number does not match the registered user.',
          EMERGENCY_PHONE_NUMBER
        )
      );

      return res.json({
        statusCode: HttpStatusCode.BadRequest,
        success: false,
        error: verification.error,
      });
    }

    userId = parsedData.userId;
  } else {
    // No user ID provided - look up by phone number
    const userResult = await findUserByPhoneNumber(payload.sender);
    if (!userResult.found || !userResult.user) {
      logger.warn(`[WORKER] User not found for phone number ${payload.sender}`);

      await markMessageProcessed(id, {
        status: 'failed',
        error: 'User not found',
      });

      // Send error SMS
      await sendLocalSMS(
        payload.sender,
        SMS_TEMPLATES.USER_NOT_FOUND(EMERGENCY_PHONE_NUMBER)
      );

      return res.json({
        statusCode: HttpStatusCode.Unauthorized,
        success: false,
        error: 'User not found',
      });
    }

    userId = userResult.user.id;
  }

  // Create the emergency request
  try {
    const result = await createEmergencyRequest(userId, parsedData);

    if (!result.success || !result.requestId) {
      await markMessageProcessed(id, {
        userId,
        status: 'failed',
        error: result.error,
      });

      await sendLocalSMS(
        payload.sender,
        SMS_TEMPLATES.REQUEST_FAILED(
          result.error || 'Failed to create request',
          EMERGENCY_PHONE_NUMBER
        )
      );

      return res.json({
        success: false,
        error: result.error,
      });
    }

    // Mark as successfully processed
    await markMessageProcessed(id, {
      requestId: result.requestId,
      userId,
      status: 'success',
    });

    function formatEmergencyType(type: string): string {
      const types: Record<string, string> = {
        ambulance: 'Medical/Ambulance',
        police: 'Police',
        fire_truck: 'Fire',
        rescue_team: 'Rescue',
      };
      return types[type] || type;
    }

    // Send confirmation SMS
    const emergencyTypeDisplay = formatEmergencyType(parsedData.emergencyType);
    await sendLocalSMS(
      payload.sender,
      SMS_TEMPLATES.REQUEST_RECEIVED(result.requestId, emergencyTypeDisplay)
    );

    logger.info(
      `[SMS WEBHOOK] Successfully processed SMS ${id}, created request ${result.requestId}`
    );

    return res.json({
      success: true,
      requestId: result.requestId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[SMS WEBHOOK] Error processing SMS ${id}:`, error);

    await markMessageProcessed(id, {
      userId,
      status: 'failed',
      error: errorMessage,
    });

    await sendSMS(
      payload.sender,
      SMS_TEMPLATES.REQUEST_FAILED(
        'An unexpected error occurred',
        EMERGENCY_PHONE_NUMBER
      )
    );

    return res.json({
      success: false,
      error: errorMessage,
    });
  }
});

const registerSmsWebhook = async () => {
  try {
    const webhookData = {
      id: 'emergency-webhook',
      url: `${envConfig.backend_base_path}/webhooks/messaging`,
      event: Events.SmsReceived,
    };

    const token = `${envConfig.sms_username}:${envConfig.sms_password}`;
    const auth_token = `Basic ${Buffer.from(token).toString('base64')}`;

    logger.info('[SMS WEBHOOK] Registering');
    const response = await axios.post(
      `${envConfig.sms_uri_base}${SmsRoutes.registerWebhook}`,
      webhookData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth_token,
        },
      }
    );

    console.log('WEBHOOK: ', response.data);
    logger.info('[SMS WEBHOOK] Registered Successfully');
  } catch (error) {
    logger.error('[SMS WEBHOOK] Failed to register:', error);
    throw error;
  }
};

export { handleSmsWebhook, registerSmsWebhook };
