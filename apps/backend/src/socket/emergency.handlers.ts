import type { Server, Socket } from 'socket.io';

import { envConfig } from '@/config';
import { logger } from '@/config/logger/winston.config';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import { acceptRequest } from '@/services/emergency/accept-request.service';
import { cancelRequest } from '@/services/emergency/cancel-request.service';
import { confirmArrival } from '@/services/emergency/confirm-arrival.service';
import { providerConnect } from '@/services/emergency/provider-connect.service';
import { rejectRequest } from '@/services/emergency/reject-request.service';
import { userJoinRoom } from '@/services/emergency/user-join-room.service';
import { cacheProviderLocation } from '@/services/redis.service';
import type { TEntityRole } from '@/utils/tokens/jwtTokens';

export function registerEmergencyHandlers(
  io: Server,
  socket: Socket,
  role: TEntityRole
): void {
  logger.debug('Registering handlers for', role);

  socket.on(
    SocketEvents.PROVIDER_CONNECT,
    async (data: { providerId?: string; requestId?: string }) => {
      if (data.providerId && !data.requestId) {
        socket.join(SocketRoom.PROVIDER(data.providerId));
        logger.info(`[ROOM_JOIN] Provider ${data.providerId} joined room`);
      } else if (data.requestId && data.providerId) {
        await handleProviderConnect(io, socket, {
          requestId: data.requestId,
          providerId: data.providerId,
        });
      }
    }
  );

  socket.on(
    SocketEvents.ACCEPT_REQUEST,
    async (data: { requestId: string; providerId: string }) => {
      await handleAcceptRequest(io, socket, data);
    }
  );

  socket.on(
    'reject-request',
    async (data: { requestId: string; providerId: string }) => {
      await handleRejectRequest(io, socket, data);
    }
  );

  socket.on(
    SocketEvents.USER_JOIN_ROOM,
    async (data: { requestId: string; userId: string }) => {
      await handleUserJoinRoom(io, socket, data);
    }
  );

  socket.on(
    SocketEvents.LOCATION_UPDATE,
    async (data: {
      requestId: string;
      providerId?: string;
      userId?: string;
      location: { lat: number; lng: number };
      timestamp: number;
      isProvider?: boolean;
    }) => {
      await handleLocationUpdate(io, socket, data);
    }
  );

  socket.on(
    SocketEvents.CONFIRM_ARRIVAL,
    async (
      data: { requestId: string; role: 'user' | 'provider' },
      callback?: (ack?: any) => void
    ) => {
      await handleConfirmArrival(io, socket, data, callback);
    }
  );

  socket.on(
    SocketEvents.CANCEL_REQUEST_SOCKET,
    async (
      data: { requestId: string; role: 'user' | 'provider' },
      callback?: (ack?: any) => void
    ) => {
      await handleCancelRequestSocket(io, socket, data, callback);
    }
  );
}

async function handleAcceptRequest(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;
  logger.info(`[ACCEPT_ATTEMPT] Provider ${providerId} → request ${requestId}`);

  const result = await acceptRequest({ requestId, providerId });

  if (result.outcome === 'already_taken') {
    socket.emit(SocketEvents.REQUEST_ALREADY_TAKEN, {
      requestId,
      message: result.message,
    });
    return;
  }

  if (result.outcome === 'failed') {
    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: result.message,
    });
    return;
  }

  // outcome === 'accepted'
  const { request, provider, route, providerIds } = result;

  // Notify all providers in the race
  for (const pId of providerIds) {
    io.to(SocketRoom.PROVIDER(pId)).emit(SocketEvents.REQUEST_TAKEN, {
      requestId,
      providerId,
      takenBy: providerId,
      message:
        pId === providerId
          ? 'You accepted this request!'
          : 'This request was accepted by another provider',
    });
  }

  // Notify the requestor
  io.to(`user:${request.userId}`).emit(SocketEvents.REQUEST_ACCEPTED, {
    requestId,
    provider: {
      id: provider?.id,
      name: provider?.name,
      phone: provider?.phoneNumber?.toString(),
      serviceType: provider?.serviceType,
      vehicleNumber: provider?.vehicleInformation?.number,
      location: provider?.currentLocation,
    },
    route: route,
    message: 'Help is on the way!',
  });

  // Notify platform if in silo mode
  if (envConfig.platform_base_url && request.userId) {
    notifyPlatform(request.userId, requestId, provider, route);
  }
}

async function handleRejectRequest(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;
  logger.info(`[REJECT] Provider ${providerId} rejected request ${requestId}`);

  const result = await rejectRequest({ requestId, providerId });

  socket.emit('reject-confirmed', {
    requestId,
    message:
      result.outcome === 'not_found'
        ? 'Request not found.'
        : 'Request rejected.',
  });
}

async function handleProviderConnect(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;
  logger.info(
    `[CONNECTED] Provider ${providerId} connecting to request ${requestId}`
  );

  const result = await providerConnect({ requestId, providerId });

  if (result.outcome === 'not_assigned') {
    socket.emit(SocketEvents.CONNECTION_REJECTED, {
      requestId,
      reason: 'not-assigned',
      message: result.message,
    });
    return;
  }

  if (result.outcome === 'not_found') {
    socket.emit(SocketEvents.CONNECTION_REJECTED, {
      requestId,
      reason: 'not-found',
      message: result.message,
    });
    return;
  }

  // outcome === 'connected'
  socket.join(result.roomName);
  logger.debug(`[ROOM] Provider ${providerId} joined room ${result.roomName}`);

  // Tell requestor to join the same room
  io.to(`user:${result.userId}`).emit(SocketEvents.JOIN_ROOM, {
    room: result.roomName,
    requestId,
    message: 'Provider connected. Join room for tracking.',
  });

  // Confirm connection to provider
  socket.emit(SocketEvents.CONNECTION_CONFIRMED, {
    requestId,
    message: 'Connected successfully. You can now start navigation.',
    roomId: result.roomName,
  });
}

async function handleUserJoinRoom(
  io: Server,
  socket: Socket,
  data: { requestId: string; userId: string }
): Promise<void> {
  const { requestId, userId } = data;

  const result = await userJoinRoom({ requestId, userId });

  if (result.outcome === 'not_found') {
    socket.emit('join-failed', { requestId, message: result.message });
    return;
  }

  const roomName = SocketRoom.EMERGENCY(requestId);
  socket.join(roomName);
  logger.debug(`[ROOM] User ${userId} joined room ${roomName}`);

  socket.emit(SocketEvents.JOINED_EMERGENCY_ROOM, {
    requestId,
    emergencyLocation: result.emergencyLocation,
    emergencyType: result.emergencyType,
    providerId: result.providerId,
    providerLocation: result.providerLocation,
    status: result.requestStatus,
    userId,
  });

  // Notify provider that user joined
  if (result.providerId) {
    io.to(SocketRoom.PROVIDER(result.providerId)).emit('user-joined-room', {
      requestId,
      userId,
    });
  }
}

async function handleLocationUpdate(
  io: Server,
  socket: Socket,
  data: {
    requestId: string;
    providerId?: string;
    userId?: string;
    location: { lat: number; lng: number };
    timestamp: number;
    isProvider?: boolean;
  }
): Promise<void> {
  const { requestId, providerId, userId, location, timestamp, isProvider } =
    data;
  const senderId = isProvider ? providerId : userId;
  const senderType = isProvider ? 'Provider' : 'User';

  const roomName = SocketRoom.EMERGENCY(requestId);
  const rooms = Array.from(socket.rooms);

  if (!rooms.includes(roomName)) {
    logger.warn(`[WARN] ${senderType} ${senderId} not in room ${roomName}`);
    return;
  }

  if (
    !location ||
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number' ||
    location.lat < -90 ||
    location.lat > 90 ||
    location.lng < -180 ||
    location.lng > 180
  ) {
    logger.warn(
      `[WARN] Invalid coordinates from ${senderType} ${senderId}:`,
      location
    );
    return;
  }

  if (isProvider && providerId) {
    cacheProviderLocation(providerId, {
      lat: location.lat,
      lng: location.lng,
      timestamp: timestamp || Date.now(),
      requestId,
    }).catch(error => {
      logger.error('Redis unavailable for location cache:', error);
    });
  }

  const eventName = isProvider
    ? SocketEvents.PROVIDER_LOCATION_UPDATED
    : SocketEvents.USER_LOCATION_UPDATED;

  io.to(roomName).emit(eventName, {
    location: {
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
    },
    timestamp: timestamp || Date.now(),
    providerId: isProvider ? providerId : undefined,
    userId: !isProvider ? userId : undefined,
  });
}

async function handleConfirmArrival(
  io: Server,
  socket: Socket,
  data: { requestId: string; role: 'user' | 'provider' },
  callback?: (ack?: any) => void
): Promise<void> {
  const { requestId, role } = data;

  const result = await confirmArrival({ requestId, role });

  if (result.outcome === 'not_found') {
    callback?.({ error: result.message });
    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: result.message,
    });
    return;
  }

  if (result.outcome === 'no_provider') {
    callback?.({ error: result.message });
    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: result.message,
    });
    return;
  }

  // outcome === 'completed'
  callback?.();

  logger.info(
    `[COMPLETED] Request ${requestId} marked as completed by ${role}`
  );

  const completionPayload = {
    requestId,
    completedBy: role,
    completedAt: result.completedAt,
    message: 'Emergency has been marked as complete.',
  };

  io.to(SocketRoom.EMERGENCY(requestId)).emit(
    SocketEvents.REQUEST_COMPLETED,
    completionPayload
  );

  if (result.userId) {
    io.to(SocketRoom.USER(result.userId)).emit(
      SocketEvents.REQUEST_COMPLETED,
      completionPayload
    );
  }

  if (result.serviceProviderId) {
    io.to(SocketRoom.PROVIDER(result.serviceProviderId)).emit(
      SocketEvents.REQUEST_COMPLETED,
      completionPayload
    );
  }

  // Forward completion to platform
  if (envConfig.platform_base_url && result.userId) {
    const { postJsonWithRetry } =
      await import('@/services/internal-http.service');
    postJsonWithRetry(
      `${envConfig.platform_base_url}/api/v1/internal/incidents/${requestId}/update`,
      {
        headers: { 'x-internal-api-key': envConfig.internal_api_key! },
        body: {
          userId: result.userId,
          eventType: SocketEvents.REQUEST_COMPLETED,
          requestStatus: 'completed',
          payload: { completedBy: role, completedAt: result.completedAt },
        },
        timeoutMs: 1000,
        backoffMs: 500,
        retries: 1,
      }
    ).catch(e => logger.warn(`[COMPLETE] Failed to notify platform: ${e}`));
  }
}

async function handleCancelRequestSocket(
  io: Server,
  socket: Socket,
  data: { requestId: string; role: 'user' | 'provider' },
  callback?: (ack?: any) => void
): Promise<void> {
  const { requestId, role } = data;
  logger.debug(`[CANCEL] ${role} cancelling request ${requestId}`);

  const result = await cancelRequest({ requestId, role });

  if (result.outcome === 'not_found') {
    callback?.({ error: result.message });
    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: result.message,
    });
    return;
  }

  if (result.outcome === 'already_cancelled') {
    callback?.({ error: result.message });
    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: result.message,
    });
    return;
  }

  callback?.();

  const messageText =
    role === 'user'
      ? 'The user has cancelled this emergency request.'
      : 'The service provider has cancelled this emergency request.';

  const cancelPayload = {
    requestId,
    cancelledBy: role,
    cancelledAt: result.cancelledAt,
    message: messageText,
  };

  io.to(SocketRoom.EMERGENCY(requestId)).emit(
    SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
    cancelPayload
  );

  if (result.userId) {
    io.to(SocketRoom.USER(result.userId)).emit(
      SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
      cancelPayload
    );
  }

  if (result.serviceProviderId) {
    io.to(SocketRoom.PROVIDER(result.serviceProviderId)).emit(
      SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
      cancelPayload
    );
  }
}

async function notifyPlatform(
  userId: string,
  requestId: string,
  provider: any,
  route: any
): Promise<void> {
  try {
    const { postJsonWithRetry } =
      await import('@/services/internal-http.service');
    await postJsonWithRetry(
      `${envConfig.platform_base_url}/api/v1/internal/incidents/${requestId}/update`,
      {
        headers: { 'x-internal-api-key': envConfig.internal_api_key! },
        body: {
          userId,
          eventType: SocketEvents.REQUEST_ACCEPTED,
          requestStatus: 'accepted',
          provider: {
            id: provider?.id,
            name: provider?.name,
            phone: provider?.phoneNumber?.toString(),
            serviceType: provider?.serviceType,
            vehicleNumber: provider?.vehicleInformation?.number,
            location: provider?.currentLocation,
          },
          route,
        },
        timeoutMs: 2000,
        retries: 1,
        backoffMs: 500,
      }
    );
  } catch (e) {
    logger.warn(`[ACCEPT] Failed to notify platform: ${e}`);
  }
}
