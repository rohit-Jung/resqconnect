import { Server, Socket } from 'socket.io';

import { SocketEvents, SocketRoom } from '@/constants/socket.constants';

export function setupLocationHandlers(io: Server, socket: Socket) {
  socket.on(SocketEvents.LOCATION_UPDATE, async data => {
    const { requestId, providerId, userId, latitude, longitude, timestamp } =
      data;

    console.log(`Location update for request ${requestId}`);

    if (!requestId || (!providerId && !userId)) {
      console.error('Invalid location update data');
      return;
    }

    if (providerId) {
      // Provider location → broadcast to emergency room
      io.to(SocketRoom.EMERGENCY(requestId)).emit(
        SocketEvents.PROVIDER_LOCATION_UPDATED,
        {
          providerId,
          location: { latitude, longitude },
          timestamp: timestamp || Date.now(),
        }
      );

      // Optional: Save to database for history
      // await db.providerLocation.create({ ... });
    } else if (userId) {
      // User location → broadcast to emergency room
      io.to(SocketRoom.EMERGENCY(requestId)).emit(
        SocketEvents.USER_LOCATION_UPDATED,
        {
          userId,
          location: { latitude, longitude },
          timestamp: timestamp || Date.now(),
        }
      );

      // TODO: Optional: Save to database every few seconds
      // await db.userLocation.create({ ... });
    }
  });

  // * Handle emergency completion
  socket.on(SocketEvents.EMERGENCY_COMPLETED, async data => {
    const { requestId, providerId } = data;

    console.log(`✅ Emergency ${requestId} completed by ${providerId}`);

    // TODO: Update database
    // await db.emergency.update({ ... });

    // ✅ Notify both user and provider in room
    io.to(SocketRoom.EMERGENCY(requestId)).emit(
      SocketEvents.EMERGENCY_COMPLETED,
      {
        requestId,
        providerId,
        completedAt: Date.now(),
      }
    );

    // Optional: Remove users from room
    // io.in(SocketRoom.EMERGENCY(requestId)).socketsLeave(SocketRoom.EMERGENCY(requestId));
  });
}
