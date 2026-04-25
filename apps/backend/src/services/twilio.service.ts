import twilio from 'twilio';

import { envConfig, logger } from '@/config';
import { consumeNotificationFallbackQuota } from '@/services/entitlements.service';

function getClient() {
  // Lazily initialize to avoid import-time crashes in tests.
  return twilio(envConfig.twilio_account_sid, envConfig.twilio_auth_token);
}

function getFromNumber() {
  return envConfig.twilio_from_number || envConfig.to_number;
}

export interface TwilioMessage {
  sid: string;
  body: string;
  from: string;
  to: string;
  dateSent: Date | null;
  dateCreated: Date;
  status: string;
  direction: string;
}

export interface SendSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export type SendSMSOptions = {
  // If provided, SMS consumes this org's notification_fallback_quota.
  organizationId?: string;
};

export async function getMessages(
  to: string,
  limit: number = 20,
  dateSentAfter?: Date
): Promise<TwilioMessage[]> {
  try {
    const client = getClient();
    const options: {
      limit: number;
      to: string;
      dateSentAfter?: Date;
    } = {
      limit,
      to,
    };

    if (dateSentAfter) {
      options.dateSentAfter = dateSentAfter;
    }

    const messages = await client.messages.list(options);

    return messages.map(msg => ({
      sid: msg.sid,
      body: msg.body || '',
      from: msg.from || '',
      to: msg.to || '',
      dateSent: msg.dateSent,
      dateCreated: msg.dateCreated,
      status: msg.status,
      direction: msg.direction,
    }));
  } catch (error) {
    logger.error('Error fetching Twilio messages:', error);
    throw error;
  }
}

export async function sendSMS(
  to: string,
  body: string,
  options: SendSMSOptions = {}
): Promise<SendSMSResult> {
  try {
    if (options.organizationId) {
      const quota = await consumeNotificationFallbackQuota({
        organizationId: options.organizationId,
        quantity: 1,
      });
      if (!quota.allowed) {
        logger.warn(
          `Org ${options.organizationId} SMS fallback quota exceeded (used=${quota.used}, limit=${quota.limit}, bucket=${quota.bucket})`
        );
        return {
          success: false,
          error: 'SMS quota exceeded',
        };
      }
    }

    const fromNumber = getFromNumber();
    if (!fromNumber) {
      logger.error('Twilio from number not configured');
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }

    const client = getClient();

    // Ensure phone number is in E.164 format
    let formattedTo = to.trim();
    if (!formattedTo.startsWith('+')) {
      formattedTo = `+${formattedTo}`;
    }

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });

    logger.info(`SMS sent successfully to ${formattedTo}, SID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

export async function sendBulkSMS(
  recipients: string[],
  body: string,
  options: SendSMSOptions = {}
): Promise<SendSMSResult[]> {
  const results = await Promise.allSettled(
    recipients.map(to => sendSMS(to, body, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      error: `Failed to send to ${recipients[index]}: ${result.reason}`,
    };
  });
}

export async function verifyPhoneNumber(
  phoneNumber: string
): Promise<{ valid: boolean; formatted?: string; error?: string }> {
  try {
    const client = getClient();
    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = `+${formattedNumber}`;
    }

    const lookup = await client.lookups.v2
      .phoneNumbers(formattedNumber)
      .fetch();

    return {
      valid: lookup.valid || false,
      formatted: lookup.phoneNumber,
    };
  } catch (error) {
    logger.error('Phone verification error:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Lookup failed',
    };
  }
}

export default {
  getMessages,
  sendSMS,
  sendBulkSMS,
  verifyPhoneNumber,
};
