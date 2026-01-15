import { eq } from 'drizzle-orm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

import { socketEvents } from '@/constants/socket.constants';
import db from '@/db';
import {
  emergencyContact,
  notifications,
  serviceProvider,
  user,
} from '@/models';
import { getIo } from '@/socket';

// Initialize Expo SDK for push notifications
const expo = new Expo();

// Types for notification payloads
interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default' | null;
}

interface SMSPayload {
  to: string;
  message: string;
}

interface EmergencyNotificationData {
  requestId: string;
  userId: string;
  userName: string;
  emergencyType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message?: string;
}

/**
 * Send push notification via Expo
 */
export async function sendPushNotification(
  pushTokens: string[],
  notification: NotificationPayload
): Promise<ExpoPushTicket[]> {
  const messages: ExpoPushMessage[] = [];

  for (const pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: notification.sound ?? 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data,
      priority: notification.priority ?? 'high',
    });
  }

  if (messages.length === 0) {
    return [];
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }

  return tickets;
}

/**
 * Send SMS notification using Twilio or another SMS provider
 * For now, this is a placeholder that logs the SMS
 * You'll need to integrate with Twilio or another SMS provider
 */
export async function sendSMS(payload: SMSPayload): Promise<boolean> {
  // TODO: Integrate with Twilio or another SMS service
  // For now, we'll just log the SMS
  console.log(`📱 SMS to ${payload.to}: ${payload.message}`);

  // Example Twilio integration (uncomment and configure when ready):
  /*
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  const client = require('twilio')(accountSid, authToken);

  try {
    await client.messages.create({
      body: payload.message,
      from: twilioNumber,
      to: payload.to,
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
  */

  return true;
}

/**
 * Send notification to a user
 */
export async function notifyUser(
  userId: string,
  notification: NotificationPayload
): Promise<void> {
  try {
    // Get user's push token
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        pushToken: true,
        name: true,
      },
    });

    if (!userRecord) {
      console.error(`User ${userId} not found`);
      return;
    }

    // Store notification in database
    await db.insert(notifications).values({
      userId,
      message: notification.body,
      type: (notification.data?.type as string) || 'general',
      source: 'system',
      priority: notification.priority === 'high' ? 'high' : 'low',
      metadata: notification.data,
      deliveryStatus: 'pending',
    });

    // Send socket notification for real-time update
    const io = getIo();
    if (io) {
      io.to(`user:${userId}`).emit(socketEvents.NOTIFICATION_RECEIVED, {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        timestamp: new Date().toISOString(),
      });
    }

    // Send push notification if token exists
    if (userRecord.pushToken) {
      await sendPushNotification([userRecord.pushToken], notification);
    }
  } catch (error) {
    console.error('Error notifying user:', error);
  }
}

/**
 * Send notification to a service provider
 */
export async function notifyServiceProvider(
  providerId: string,
  notification: NotificationPayload
): Promise<void> {
  try {
    // Get provider's push token (assuming we add pushToken to service provider model)
    const providerRecord = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
      columns: {
        id: true,
        name: true,
      },
    });

    if (!providerRecord) {
      console.error(`Service provider ${providerId} not found`);
      return;
    }

    // Store notification in database
    await db.insert(notifications).values({
      serviceProviderId: providerId,
      message: notification.body,
      type: (notification.data?.type as string) || 'general',
      source: 'system',
      priority: notification.priority === 'high' ? 'high' : 'low',
      metadata: notification.data,
      deliveryStatus: 'pending',
    });

    // Send socket notification
    const io = getIo();
    if (io) {
      io.to(`provider:${providerId}`).emit(socketEvents.NOTIFICATION_RECEIVED, {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error notifying service provider:', error);
  }
}

/**
 * Notify emergency contacts when an emergency request is created
 */
export async function notifyEmergencyContacts(
  data: EmergencyNotificationData
): Promise<void> {
  try {
    // Get user's settings
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, data.userId),
      columns: {
        id: true,
        name: true,
        notifyEmergencyContacts: true,
        emergencyNotificationMethod: true,
      },
    });

    if (!userRecord || !userRecord.notifyEmergencyContacts) {
      console.log(
        'Emergency contact notification disabled for user:',
        data.userId
      );
      return;
    }

    // Get user's emergency contacts
    const contacts = await db.query.emergencyContact.findMany({
      where: eq(emergencyContact.userId, data.userId),
    });

    if (contacts.length === 0) {
      console.log('No emergency contacts found for user:', data.userId);
      return;
    }

    const notificationMethod = userRecord.emergencyNotificationMethod || 'both';
    const googleMapsUrl = `https://maps.google.com/?q=${data.location.latitude},${data.location.longitude}`;

    const smsMessage = `🚨 EMERGENCY ALERT 🚨\n${data.userName} has requested emergency assistance (${data.emergencyType}).\nLocation: ${googleMapsUrl}\n${data.message || 'Please check on them immediately.'}`;

    const pushNotification: NotificationPayload = {
      title: '🚨 Emergency Alert',
      body: `${data.userName} has requested ${data.emergencyType} assistance!`,
      priority: 'high',
      data: {
        type: 'emergency_contact_alert',
        requestId: data.requestId,
        userId: data.userId,
        userName: data.userName,
        emergencyType: data.emergencyType,
        location: data.location,
        mapsUrl: googleMapsUrl,
      },
    };

    for (const contact of contacts) {
      if (!contact.notifyOnEmergency) continue;

      const contactMethod = contact.notificationMethod || notificationMethod;

      // Send SMS if enabled
      if (contactMethod === 'sms' || contactMethod === 'both') {
        await sendSMS({
          to: contact.phoneNumber,
          message: smsMessage,
        });
      }

      // Send push notification if contact has the app and push token
      if (
        (contactMethod === 'push' || contactMethod === 'both') &&
        contact.pushToken
      ) {
        await sendPushNotification([contact.pushToken], pushNotification);
      }
    }

    console.log(
      `✅ Notified ${contacts.length} emergency contacts for user ${data.userId}`
    );
  } catch (error) {
    console.error('Error notifying emergency contacts:', error);
  }
}

/**
 * Send emergency request notification to provider
 */
export async function sendEmergencyRequestNotification(
  providerId: string,
  requestData: {
    requestId: string;
    emergencyType: string;
    userName: string;
    distance: number;
    location: { latitude: number; longitude: number };
  }
): Promise<void> {
  const notification: NotificationPayload = {
    title: '🚨 New Emergency Request',
    body: `${requestData.emergencyType.toUpperCase()} emergency - ${requestData.distance.toFixed(1)}km away`,
    priority: 'high',
    data: {
      type: 'emergency_request',
      requestId: requestData.requestId,
      emergencyType: requestData.emergencyType,
      userName: requestData.userName,
      distance: requestData.distance,
      location: requestData.location,
    },
  };

  await notifyServiceProvider(providerId, notification);
}

/**
 * Send request status update to user
 */
export async function sendRequestStatusNotification(
  userId: string,
  status: 'accepted' | 'cancelled' | 'completed' | 'provider_assigned',
  details: {
    requestId: string;
    providerName?: string;
    eta?: number;
    message?: string;
  }
): Promise<void> {
  const statusMessages: Record<string, { title: string; body: string }> = {
    accepted: {
      title: '✅ Help is on the way!',
      body: `${details.providerName || 'A responder'} has accepted your request${details.eta ? ` and will arrive in ~${details.eta} min` : ''}.`,
    },
    provider_assigned: {
      title: '👤 Responder Assigned',
      body: `${details.providerName || 'A responder'} has been assigned to your emergency.`,
    },
    cancelled: {
      title: '❌ Request Cancelled',
      body: details.message || 'Your emergency request has been cancelled.',
    },
    completed: {
      title: '✅ Request Completed',
      body: 'Your emergency request has been marked as complete. Stay safe!',
    },
  };

  const { title, body } = statusMessages[status] || {
    title: 'Request Update',
    body: details.message || 'Your request has been updated.',
  };

  await notifyUser(userId, {
    title,
    body,
    priority: 'high',
    data: {
      type: `request_${status}`,
      requestId: details.requestId,
      providerName: details.providerName,
      eta: details.eta,
    },
  });
}

/**
 * Bulk send notifications to multiple providers
 */
export async function notifyNearbyProviders(
  providerIds: string[],
  notification: NotificationPayload
): Promise<void> {
  const promises = providerIds.map(id =>
    notifyServiceProvider(id, notification)
  );
  await Promise.allSettled(promises);
}

export default {
  sendPushNotification,
  sendSMS,
  notifyUser,
  notifyServiceProvider,
  notifyEmergencyContacts,
  sendEmergencyRequestNotification,
  sendRequestStatusNotification,
  notifyNearbyProviders,
};
