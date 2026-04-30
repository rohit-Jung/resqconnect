import axios from 'axios';

import { envConfig, logger } from '@/config';

import type { SendSMSResult } from './twilio.service';

const fromNumber = envConfig.twilio_from_number || envConfig.to_number;

export enum SmsRoutes {
  registerWebhook = '/webhooks',
  sendMessage = '/messages',
}

export async function postSMS(
  body: string,
  path: string = '/messages',
  to?: string
): Promise<{ success: boolean; data: any }> {
  try {
    const params = {
      skipPhoneValidation: true,
      deviceActiveWithin: 12,
    };

    const payload = to
      ? {
          textMessage: {
            text: body,
          },
          deviceId: envConfig.sms_device_id,
          phoneNumbers: [to],
          simNumber: 1,
          ttl: 3600,
          priority: 100,
        }
      : {
          body,
        };

    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await axios.post(`${envConfig.sms_uri}${path}`, payload, {
      params,
      headers,
      auth: {
        username: envConfig.sms_username,
        password: envConfig.sms_password,
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (err: any) {
    console.log('ERROR registering webhook');
    console.log(err);
    throw new Error(err);
  }
}

export async function sendLocalSMS(
  to: string,
  body: string
): Promise<SendSMSResult> {
  try {
    if (!fromNumber) {
      logger.error('From number not configured');
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    // Ensure phone number is in E.164 format
    let formattedTo = to.trim();
    if (!formattedTo.startsWith('+')) {
      formattedTo = `+${formattedTo}`;
    }

    const response = postSMS(body, SmsRoutes.sendMessage, to);
    console.log('[SMS WEBHOOK]: Message data', response);

    logger.info(`SMS sent successfully to ${formattedTo}, SID: $`);

    return {
      success: true,
      messageSid: 'idk',
    };
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}
