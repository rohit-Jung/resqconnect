import { eq } from 'drizzle-orm';
import type { Server } from 'socket.io';

import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import { socketEvents } from '@/constants/socket.constants';
import db from '@/db';
import { emergencyRequest, serviceProvider } from '@/models';
import { consumer } from '@/services/kafka.service';
import { findNearbyProviders } from '@/services/matching.service';
import { getIo } from '@/socket';

async function startEmergencyRequestService() {
  await consumer.connect();
  await consumer.subscribe({ topic: KAFKA_TOPICS.EMERGENCY_CREATED });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { id, userId, emergencyType, emergencyLocation } = JSON.parse(
        message.value!.toString()
      );

      // update the request status in progress
      await db
        .update(emergencyRequest)
        .set({
          requestStatus: 'in_progress',
        })
        .where(eq(emergencyRequest.id, id));

      const { latitude, longitude } = emergencyLocation;
      const providers = await findNearbyProviders({
        lat: latitude,
        lng: longitude,
        type: emergencyType,
      });

      const io = getIo();
      if (!io) {
        // TODO: look at here
        return;
      }

      for (const provider of providers) {
        io.to(provider.id).emit(socketEvents.NEW_EMERGENCY, {
          requestId: id,
          emergencyType,
          location: emergencyLocation,
        });

        const result = await waitForProvider({
          io,
          requestId: id,
          providerId: provider.id,
        });

        if (result == 'ACCEPTED') {
          // update status
          await Promise.all([
            db
              .update(serviceProvider)
              .set({
                serviceStatus: 'assigned',
              })
              .where(eq(serviceProvider.id, provider.id)),
            db
              .update(emergencyRequest)
              .set({ requestStatus: 'assigned' })
              .where(eq(emergencyRequest.id, id)),
          ]);

          // join the user and provider in the same room
          io.in(provider.id).socketsJoin(socketEvents.EMERGENCY_ROOM(id));
          io.in(userId).socketsJoin(socketEvents.EMERGENCY_ROOM(id));

          // emit joined room to both
          io.to(socketEvents.EMERGENCY_ROOM(id)).emit(socketEvents.JOINED_EMERGENCY_ROOM, {
            requestId: id,
            emergencyLocation: emergencyLocation,
            emergencyType: emergencyType,
            providerId: provider.id,
          });
        }
      }
    },
  });
}

async function waitForProvider({
  io,
  requestId,
  providerId,
  timeoutMs = 60_000,
}: {
  io: Server;
  requestId: string;
  providerId: string;
  timeoutMs?: number;
}): Promise<'ACCEPTED' | 'REJECTED' | 'TIMEOUT'> {
  return new Promise((res, _) => {
    const timer = setTimeout(() => {
      cleanup();
      res('TIMEOUT');
    }, timeoutMs);

    const handler = (payload: {
      requestId: string;
      providerId: string;
      decision: 'ACCEPTED' | 'REJECTED';
    }) => {
      if (payload.requestId == requestId && payload.providerId == providerId) {
        cleanup();
        res(payload.decision);
      }
    };

    function cleanup() {
      clearTimeout(timer);
      io.off(socketEvents.PROVIDER_DECISION, handler);
    }

    io.on(socketEvents.PROVIDER_DECISION, handler);
  });
}

export { startEmergencyRequestService };
