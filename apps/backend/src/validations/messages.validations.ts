import { z } from 'zod';

import { emergencyRequestSchema } from '@/models';

export const messageSchema = emergencyRequestSchema.pick({
  userId: true,
  location: true,
  serviceType: true,
  description: true,
});

export const Events = {
  SmsReceived: 'sms:received',
  SmsSent: 'sms:sent',
  SmsDelivered: 'sms:delivered',
  SmsFailed: 'sms:failed',
  SmsDataReceived: 'sms:data-received',
  MmsReceived: 'mms:received',
  MmsDownloaded: 'mms:downloaded',
  SysPing: 'system:ping',
} as const;

export const EventsEnum = z.enum(
  Object.values(Events) as [string, ...string[]]
);
export type Events = (typeof Events)[keyof typeof Events];

export const MessagePayloadSchema = z.object({
  message: z.string(),
  receivedAt: z.string(), // ISO format validation
  messageId: z.string(),
  phoneNumber: z.string(),
  recipient: z.string(),
  sender: z.string(),
  simNumber: z.number(),
});

export type MessagePayload = z.infer<typeof MessagePayloadSchema>;

export const SmsGatewaySchema = z.object({
  deviceId: z.string(),
  event: EventsEnum,
  id: z.string(),
  payload: MessagePayloadSchema,
  webhookId: z.string(),
});

export type SmsGatewayInterface = z.infer<typeof SmsGatewaySchema>;
