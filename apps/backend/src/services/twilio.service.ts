import twilio from 'twilio';

import { envConfig, logger } from '@/config';

const accountSid = envConfig.twilio_account_sid;
const authToken = envConfig.twilio_auth_token;
const fromNumber = envConfig.twilio_from_number || envConfig.to_number;

const client = twilio(accountSid, authToken);

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

export async function getMessages(
  to: string,
  limit: number = 20,
  dateSentAfter?: Date
): Promise<TwilioMessage[]> {
  try {
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
  body: string
): Promise<SendSMSResult> {
  try {
    if (!fromNumber) {
      logger.error('Twilio from number not configured');
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
  body: string
): Promise<SendSMSResult[]> {
  const results = await Promise.allSettled(
    recipients.map(to => sendSMS(to, body))
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
