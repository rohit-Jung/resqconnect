import { emergencyRequest } from '@repo/db/schemas';

import { eq } from 'drizzle-orm';

import { logger } from '@/config';
import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import { incidentUpdateConsumer } from '@/services/kafka/kafka.service';
import { getIo } from '@/socket';

export type IncidentStatusUpdatePayload = {
  platformIncidentId: string;
  userId: string;
  role?: string;
  eventType: string;
  requestStatus?: string;
  provider?: Record<string, unknown>;
  route?: unknown;
  message?: string;
  payload?: Record<string, unknown>;
};

export async function startIncidentUpdateWorker() {
  logger.info('Starting incident update consumer (platform)...');

  await incidentUpdateConsumer.subscribe({
    topics: [KAFKA_TOPICS.INCIDENT_STATUS_UPDATE],
    fromBeginning: false,
  });

  await incidentUpdateConsumer.run({
    eachMessage: async ({ message }) => {
      let data: IncidentStatusUpdatePayload;
      try {
        data = JSON.parse(
          message.value!.toString()
        ) as IncidentStatusUpdatePayload;
      } catch {
        logger.error('incident-update: invalid JSON in message');
        return;
      }

      const {
        platformIncidentId,
        userId,
        role,
        eventType,
        requestStatus,
        provider,
        route,
        message: msg,
        payload,
      } = data;

      if (!platformIncidentId || !userId || !eventType) {
        logger.warn('incident-update: missing required fields, skipping');
        return;
      }

      // console.log(
      //   `incident-update: eventType ${eventType}, ${userId}, ${JSON.stringify(provider)}, ${role}, ${JSON.stringify(payload)}`
      // );

      if (requestStatus) {
        await db
          .update(emergencyRequest)
          .set({ requestStatus: requestStatus as any })
          .where(eq(emergencyRequest.id, platformIncidentId));
      }

      const io = getIo();
      if (!io) return;

      const room =
        role === 'service_provider'
          ? SocketRoom.PROVIDER(userId)
          : SocketRoom.USER(userId);

      console.log('EMITTING to room', room);

      switch (eventType) {
        case SocketEvents.REQUEST_ACCEPTED:
          io.to(room).emit(SocketEvents.REQUEST_ACCEPTED, {
            requestId: platformIncidentId,
            provider,
            route,
            message: msg,
          });
          break;
        case SocketEvents.JOINED_EMERGENCY_ROOM:
          io.to(room).emit(SocketEvents.JOINED_EMERGENCY_ROOM, {
            requestId: platformIncidentId,
            emergencyLocation: payload?.emergencyLocation,
            emergencyType: payload?.emergencyType,
            providerId: payload?.providerId,
            userId,
          });
          break;
        case SocketEvents.PROVIDER_LOCATION_UPDATED:
        case SocketEvents.USER_LOCATION_UPDATED:
        case SocketEvents.LOCATION_UPDATE:
        case SocketEvents.REQUEST_COMPLETED:
        case SocketEvents.REQUEST_CANCELLED:
        case SocketEvents.REQUEST_CANCELLED_NOTIFICATION:
        case SocketEvents.CANCEL_REQUEST_SOCKET:
        case SocketEvents.PROVIDER_CONFIRM_ARRIVAL:
        case SocketEvents.PROVIDER_ARRIVAL_CONFIRMED:
          io.to(room).emit(eventType as any, {
            requestId: platformIncidentId,
            ...(payload ?? {}),
          });
          break;
        default:
          logger.debug(
            `incident-update: unknown eventType ${eventType}, skipping emit`
          );
      }
    },
  });

  logger.info('Incident update consumer running');
}
