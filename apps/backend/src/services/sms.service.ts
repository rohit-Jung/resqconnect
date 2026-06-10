import { Events, type SmsGatewayInterface } from '@repo/types/validations';

import axios, { HttpStatusCode } from 'axios';
import type { Request, Response } from 'express';

import { envConfig, logger } from '@/config';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { SMS_TEMPLATES, parseSMSMessage } from '@/utils/sms/sms.parser';

import { SmsRoutes, sendLocalSMS } from './local-sms.service';
import { isMessageProcessed, markMessageProcessed } from './redis.service';
import { findUserByPhoneNumber, verifyUserIdentity } from './user.service';

const EMERGENCY_PHONE_NUMBER = envConfig.emergency_phone_number || '112';

const handleSmsWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { payload, event, id } = req.body as SmsGatewayInterface;

  // prevent duplicate processing on webhook retries.
  // we intentionally do this before parsing/db calls.
  if (await isMessageProcessed(id)) {
    logger.warn(`[SMS WEBHOOK] Duplicate webhook delivery ignored: ${id}`);
    return res.json({
      success: true,
      deduped: true,
    });
  }

  if (event != Events.SmsReceived) {
    return res.json(
      new ApiResponse(
        HttpStatusCode.BadRequest,
        `Incorrect Event Detected, Event should be ${Events.SmsReceived}`,
        req.body
      )
    );
  }

  logger.info(
    `[SMS WEBHOOK] Processing SMS message ${id} from ${payload.sender}`
  );

  const parseResult = parseSMSMessage(payload.message);

  if (!parseResult.success || !parseResult.data) {
    logger.warn(
      `[SMS WEBHOOK] Invalid SMS format from ${payload.sender}: ${parseResult.error}`
    );

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

  // Lazy import to avoid worker init during tests/import.
  const emergencyRequestService =
    await import('@/services/emergency/emergency-request.service');

  let userId: string;
  const userPhone: string = payload.sender;

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

  try {
    const result = await emergencyRequestService.default.create(
      userId,
      parsedData,
      'sms'
    );

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

    await sendLocalSMS(
      payload.sender,
      SMS_TEMPLATES.REQUEST_FAILED(
        'An unexpected error occurred',
        EMERGENCY_PHONE_NUMBER as string
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

    logger.debug('URL', envConfig.backend_base_path);

    const token = `${envConfig.sms_username}:${envConfig.sms_password}`;
    const auth_token = `Basic ${Buffer.from(token).toString('base64')}`;

    logger.info('[SMS WEBHOOK] Registering');
    const response = await axios.post(
      `${envConfig.sms_uri}${SmsRoutes.registerWebhook}`,
      webhookData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth_token,
        },
      }
    );

    logger.debug('WEBHOOK: ', response.data);
    logger.info('[SMS WEBHOOK] Registered Successfully');
  } catch (error) {
    logger.error('[SMS WEBHOOK] Failed to register:', error);
    throw error;
  }
};

export { handleSmsWebhook, registerSmsWebhook };
