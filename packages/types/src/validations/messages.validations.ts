import z from 'zod';
import { type z as zType } from 'zod';

import { serviceTypes } from '../constants/service-types';

export const messageSchema = z.object({
  userId: z.string().uuid(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  serviceType: z.enum(serviceTypes),
  description: z.string().optional(),
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

export type MessagePayload = zType.infer<typeof MessagePayloadSchema>;

export const SmsGatewaySchema = z.object({
  deviceId: z.string(),
  event: EventsEnum,
  id: z.string(),
  payload: MessagePayloadSchema,
  webhookId: z.string(),
});

export type SmsGatewayInterface = zType.infer<typeof SmsGatewaySchema>;
